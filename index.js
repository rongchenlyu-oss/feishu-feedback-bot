const express = require('express')
const crypto = require('crypto')
const { Readable } = require('stream')
const { Client } = require('@larksuiteoapi/node-sdk')
const config = require('./config')
const zhipu = require('./services/zhipu')
const cards = require('./services/cards')
const db = require('./db')

const app = express()
app.use(express.json())

let client = null

// ============================================================
// 工具函数
// ============================================================

/** 飞书 API 客户端（懒初始化） */
function getClient() {
  if (!client && config.feishu.appId && config.feishu.appSecret) {
    client = new Client({
      appId: config.feishu.appId,
      appSecret: config.feishu.appSecret
    })
  }
  return client
}

/** 发送文本消息 */
async function sendText(openId, text) {
  const c = getClient()
  if (!c) return console.warn('飞书未配置')
  await c.im.message.create({
    params: { receive_id_type: 'open_id' },
    data: {
      receive_id: openId,
      msg_type: 'text',
      content: JSON.stringify({ text })
    }
  })
}

/** 发送卡片消息 */
async function sendCard(openId, card) {
  const c = getClient()
  if (!c) return console.warn('飞书未配置')
  await c.im.message.create({
    params: { receive_id_type: 'open_id' },
    data: {
      receive_id: openId,
      msg_type: 'interactive',
      content: JSON.stringify(card)
    }
  })
}

/** 回复消息（在消息所在的会话中回复） */
async function replyMessage(messageId, msgType, contentObj) {
  const c = getClient()
  if (!c) return console.warn('飞书未配置')
  await c.im.message.reply({
    path: { message_id: messageId },
    data: {
      msg_type: msgType,
      content: JSON.stringify(contentObj)
    }
  })
}

// ============================================================
// Webhook: 事件回调（接收消息、验证挑战）
// ============================================================

app.post('/webhook/event', async (req, res) => {
  const body = req.body

  // 飞书 URL 挑战验证
  if (body.type === 'url_verification') {
    return res.json({ challenge: body.challenge })
  }

  // 处理消息事件
  if (body.type === 'event_callback' && body.event?.type === 'im.message.receive_v1') {
    const event = body.event
    const message = event.message
    const sender = event.sender
    const openId = sender.sender_id?.open_id
    const messageId = message.message_id

    // 不处理机器人自己发的消息
    if (sender.sender_type === 'bot') {
      return res.json({ code: 0 })
    }

    try {
      await handleMessage(openId, message, messageId)
    } catch (err) {
      console.error('处理消息失败:', err)
    }
  }

  res.json({ code: 0 })
})

// ============================================================
// Webhook: 卡片回调（按钮点击、表单提交）
// ============================================================

app.post('/webhook/card', async (req, res) => {
  const body = req.body

  // 飞书 URL 挑战验证（卡片回调同样需要）
  if (body.type === 'url_verification') {
    return res.json({ challenge: body.challenge })
  }

  const action = body.action
  const openId = body.user?.open_id

  if (!action || !openId) return res.json({ code: -1 })

  try {
    if (action.value?.action === 'generate_feedback') {
      // 解析表单数据
      const formData = {}
      for (const [key, value] of Object.entries(action.formValue || {})) {
        formData[key] = value
      }

      const studentName = formData.studentName || '学生'
      const scene = formData.scene || 'group'
      const mode = formData.mode || 'daily'
      const tone = formData.tone || 'objective'

      // 构建 Zhipu 需要的 formData 结构
      const feedbackData = {
        attendance: formData.attendance || '',
        homework: formData.homework || '',
        focus: formData.focus || '',
        knowledgeGaps: formData.knowledgeGaps || '',
        highlights: formData.highlights || '',
        mood: formData.mood || '',
        score: formData.score || '',
        maxScore: formData.maxScore || '',
        examAnalysis: formData.examAnalysis || '',
        improvement: formData.improvement || '',
        examKnowledgePoints: []
      }

      // 生成反馈
      const feedback = await zhipu.generateFeedback({ scene, mode, tone, formData: feedbackData })

      // 保存学生数据
      const studentId = 's_' + Date.now()
      db.saveStudent(openId, {
        id: studentId,
        name: studentName,
        scene,
        mode,
        tone,
        formData: feedbackData,
        updatedAt: new Date().toISOString()
      })

      // 发送结果卡片
      await sendCard(openId, cards.resultCard({ studentName, feedback }))

      return res.json({
        code: 0,
        data: {
          card: cards.resultCard({ studentName, feedback })
        }
      })
    }

    if (action.value?.action === 'new_feedback') {
      return res.json({
        code: 0,
        data: { card: cards.feedbackFormCard({}) }
      })
    }
  } catch (err) {
    console.error('卡片回调处理失败:', err)
    await sendText(openId, '生成失败: ' + err.message)
  }

  return res.json({ code: 0 })
})

// ============================================================
// 消息处理
// ============================================================

async function handleMessage(openId, message, messageId) {
  const msgType = message.msg_type
  const content = parseContent(message.content)

  if (msgType === 'text') {
    await handleTextMessage(openId, content.text || '', messageId)
  } else if (msgType === 'image') {
    await handleImageMessage(openId, message.message_id, content.image_key)
  }
}

function parseContent(contentStr) {
  try {
    return JSON.parse(contentStr)
  } catch {
    return { text: contentStr }
  }
}

async function handleTextMessage(openId, text, messageId) {
  const trimmed = text.trim()

  if (trimmed === '/反馈' || trimmed === '/feedback') {
    await sendCard(openId, cards.feedbackFormCard({}))
    return
  }

  if (trimmed === '/学生' || trimmed === '/students') {
    const students = db.getAllStudents(openId)
    if (students.length === 0) {
      await sendText(openId, '暂无学生数据。发送 /反馈 开始填写反馈。')
    } else {
      const list = students.map(s => `- ${s.name} (${s.scene === 'group' ? '班课' : '一对一'})`).join('\n')
      await sendText(openId, `📋 学生列表：\n${list}`)
    }
    return
  }

  if (trimmed === '/帮助' || trimmed === '/help') {
    await sendCard(openId, cards.helpCard())
    return
  }

  // 有@机器人但没匹配到命令
  if (trimmed.includes('@') || trimmed.startsWith('/')) {
    await sendText(openId, '可用命令：\n/反馈 - 生成课后反馈\n/学生 - 查看学生列表\n/帮助 - 使用指南\n\n或直接发送试卷图片进行分析')
  }
}

async function handleImageMessage(openId, messageId, imageKey) {
  try {
    await replyMessage(messageId, 'text', { text: '📸 正在分析试卷图片，请稍候...' })

    // 通过飞书 API 获取图片下载 URL
    const c = getClient()
    if (!c) {
      await replyMessage(messageId, 'text', { text: '机器人未配置完成' })
      return
    }

    // 获取图片二进制数据
    const imageResp = await c.im.image.get({ path: { image_id: imageKey } })
    // imageResp.data 是图片的二进制 Buffer（SDK 返回 AxiosResponse 格式）
    const rawData = imageResp.data || imageResp
    let imageBuffer
    if (Buffer.isBuffer(rawData)) {
      imageBuffer = rawData
    } else if (rawData instanceof Readable) {
      // ReadStream 模式，收集所有 chunk
      const chunks = []
      for await (const chunk of rawData) {
        chunks.push(chunk)
      }
      imageBuffer = Buffer.concat(chunks)
    } else {
      imageBuffer = Buffer.from(rawData)
    }

    const base64 = imageBuffer.toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    // 调用智谱分析
    const points = await zhipu.analyzeExamImage(dataUrl)
    const card = cards.knowledgePointsCard(points)

    await replyMessage(messageId, 'interactive', card)
  } catch (err) {
    console.error('分析图片失败:', err)
    await replyMessage(messageId, 'text', { text: '❌ 分析失败: ' + err.message })
  }
}

// ============================================================
// 启动
// ============================================================

const PORT = config.port
app.listen(PORT, () => {
  console.log(`飞书课后反馈机器人已启动 → http://localhost:${PORT}`)
  console.log(`Webhook 事件: POST /webhook/event`)
  console.log(`Webhook 卡片: POST /webhook/card`)

  if (!config.feishu.appId) {
    console.warn('⚠ 飞书 App ID 未配置，请在 .env 中填写后再在飞书开放平台配置')
  }
})

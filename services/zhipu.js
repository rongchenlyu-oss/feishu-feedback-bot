const axios = require('axios')
const config = require('../config')

const { apiKey, apiUrl, model, visionModel } = config.zhipu

// ============================================================
// 生成课后反馈（复用微信小程序的 buildPrompt 逻辑）
// ============================================================

function buildPrompt({ scene, mode, tone, formData }) {
  const sceneText = scene === 'group' ? '班课' : '一对一'
  const modeText = mode === 'daily' ? '常规课' : '考试测验'

  const toneMap = {
    objective: '语气要求：客观中立，如实陈述数据和事实，不带主观情绪，用词平实准确。',
    serious: '语气要求：严肃郑重，强调问题的重要性和紧迫性，用词紧凑有力，明确要求家长或学生引起重视。',
    encouraging: '语气要求：以鼓励为主，先肯定学生的优点和微小进步，再委婉指出不足，多用积极正面的词汇，保护学生自信心。'
  }

  const lines = []
  if (mode === 'daily') {
    if (formData.attendance) lines.push(`- 出勤情况：${formData.attendance}`)
    if (formData.homework) lines.push(`- 作业完成：${formData.homework}`)
    if (formData.focus) lines.push(`- 专注度：${formData.focus}`)
    if (formData.knowledgeGaps) lines.push(`- 知识点缺漏：${formData.knowledgeGaps}`)
    if (formData.mood) lines.push(`- 心理/情绪状态：${formData.mood}`)
    if (formData.highlights) lines.push(`- 课堂亮点/互动：${formData.highlights}`)
  } else {
    if (formData.score || formData.maxScore) {
      lines.push(`- 得分：${formData.score || '未知'} / ${formData.maxScore || '未知'}`)
    }
    const checkedPoints = (formData.examKnowledgePoints || [])
      .filter(p => p.checked)
      .map(p => p.label)
    if (checkedPoints.length > 0) {
      lines.push(`- 失分知识点：${checkedPoints.join('、')}`)
    }
    if (formData.examAnalysis) lines.push(`- 卷面情况：${formData.examAnalysis}`)
    if (formData.improvement) lines.push(`- 提分建议：${formData.improvement}`)
  }

  const dataText = lines.length > 0 ? lines.join('\n') : '（暂无填写数据）'

  return [
    {
      role: 'system',
      content: `你是一位专业的课后反馈撰写助手，专门为教师生成结构化的课后反馈内容。

【输出要求】
- 反馈内容应简洁明了，直接面向家长/学生，无需问候语
- 使用中文，语气根据要求调整
- 不要使用markdown格式，直接输出纯文本段落
- 长度控制在100-250字之间
- 结构清晰，先陈述事实，再给出建议或评价`
    },
    {
      role: 'user',
      content: `【教学场景】${sceneText} - ${modeText}
${toneMap[tone] || toneMap.objective}

【学生情况】
${dataText}

请根据以上信息，生成一段专业的课后反馈。`
    }
  ]
}

/**
 * 生成课后反馈文本
 */
async function generateFeedback(params) {
  const messages = buildPrompt(params)

  const response = await axios.post(apiUrl, {
    model,
    messages,
    temperature: 0.7,
    max_tokens: 500,
    top_p: 0.9
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    timeout: 20000
  })

  const text = response.data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('AI 返回结果为空')
  return text
}

// ============================================================
// 试卷图片分析
// ============================================================

/**
 * 分析试卷图片（接收图片URL）
 * @param {string} imageUrl - 飞书图片的临时下载 URL
 */
async function analyzeExamImage(imageUrl) {
  const content = [
    {
      type: 'text',
      text: '你是一位教学经验丰富的老师。用户上传了一张试卷图片。请分析这张图片，识别出试卷涉及的知识点和考点。\n\n请以JSON数组格式返回结果，每个元素包含"id"和"label"两个字段，label是知识点名称（如"勾股定理"、"一元二次方程"、"定语从句"等）。\n只返回JSON数组，不要其他文字。\n示例：[{"id":"kp1","label":"勾股定理"},{"id":"kp2","label":"一元二次方程"}]'
    },
    {
      type: 'image_url',
      image_url: { url: imageUrl }
    }
  ]

  const response = await axios.post(apiUrl, {
    model: visionModel,
    messages: [{ role: 'user', content }],
    temperature: 0.3,
    max_tokens: 1500
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  })

  const resultText = response.data.choices?.[0]?.message?.content || ''
  if (!resultText) throw new Error('AI 返回结果为空')

  let points
  try {
    points = JSON.parse(resultText)
  } catch {
    const m = resultText.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)
    if (m) points = JSON.parse(m[1])
    else throw new Error('AI 返回格式异常: ' + resultText)
  }

  if (!Array.isArray(points) || points.length === 0) {
    throw new Error('未提取到知识点')
  }

  return points
}

module.exports = { generateFeedback, analyzeExamImage }

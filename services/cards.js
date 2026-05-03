/**
 * 飞书交互卡片模板
 */

/**
 * 反馈表单卡片（一个完整的大卡片，包含所有字段）
 * 提交后通过 card callback 提交数据
 */
function feedbackFormCard({ studentName, scene, mode, tone, formData }) {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `反馈 - ${studentName || '新学生'}` }
    },
    elements: [
      // ---- 学生姓名 ----
      { tag: 'div', text: { tag: 'lark_md', content: '**学生姓名**' } },
      {
        tag: 'input',
        name: 'studentName',
        label: { tag: 'plain_text', content: '学生姓名' },
        placeholder: { tag: 'plain_text', content: '请输入学生姓名' },
        value: { text: studentName || '' }
      },

      // ---- 场景 ----
      { tag: 'div', text: { tag: 'lark_md', content: '**教学场景**' } },
      {
        tag: 'select_static',
        name: 'scene',
        placeholder: { tag: 'plain_text', content: '选择场景' },
        initial_option: scene || 'group',
        options: [
          { value: 'group', text: { tag: 'plain_text', content: '班课' } },
          { value: 'one-on-one', text: { tag: 'plain_text', content: '一对一' } }
        ]
      },

      // ---- 课程模式 ----
      { tag: 'div', text: { tag: 'lark_md', content: '**课程模式**' } },
      {
        tag: 'select_static',
        name: 'mode',
        placeholder: { tag: 'plain_text', content: '选择模式' },
        initial_option: mode || 'daily',
        options: [
          { value: 'daily', text: { tag: 'plain_text', content: '常规课' } },
          { value: 'exam', text: { tag: 'plain_text', content: '考试测验' } }
        ]
      },

      // ---- 语气 ----
      { tag: 'div', text: { tag: 'lark_md', content: '**语气滤镜**' } },
      {
        tag: 'select_static',
        name: 'tone',
        placeholder: { tag: 'plain_text', content: '选择语气' },
        initial_option: tone || 'objective',
        options: [
          { value: 'objective', text: { tag: 'plain_text', content: '客观' } },
          { value: 'serious', text: { tag: 'plain_text', content: '严肃' } },
          { value: 'encouraging', text: { tag: 'plain_text', content: '鼓励' } }
        ]
      },

      // ========== 常规课字段 ==========
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: '**常规课信息**' } },

      {
        tag: 'select_static',
        name: 'attendance',
        placeholder: { tag: 'plain_text', content: '出勤情况' },
        initial_option: formData?.attendance || '',
        options: [
          { value: '正常', text: { tag: 'plain_text', content: '正常' } },
          { value: '迟到', text: { tag: 'plain_text', content: '迟到' } },
          { value: '早退', text: { tag: 'plain_text', content: '早退' } },
          { value: '缺勤', text: { tag: 'plain_text', content: '缺勤' } }
        ]
      },
      {
        tag: 'select_static',
        name: 'homework',
        placeholder: { tag: 'plain_text', content: '作业完成' },
        initial_option: formData?.homework || '',
        options: [
          { value: '优', text: { tag: 'plain_text', content: '优' } },
          { value: '良', text: { tag: 'plain_text', content: '良' } },
          { value: '中', text: { tag: 'plain_text', content: '中' } },
          { value: '未交', text: { tag: 'plain_text', content: '未交' } }
        ]
      },
      {
        tag: 'select_static',
        name: 'focus',
        placeholder: { tag: 'plain_text', content: '专注度' },
        initial_option: formData?.focus || '',
        options: [
          { value: '积极互动', text: { tag: 'plain_text', content: '积极互动' } },
          { value: '专注', text: { tag: 'plain_text', content: '专注' } },
          { value: '偶有分心', text: { tag: 'plain_text', content: '偶有分心' } },
          { value: '需提醒', text: { tag: 'plain_text', content: '需提醒' } }
        ]
      },
      {
        tag: 'input',
        name: 'knowledgeGaps',
        label: { tag: 'plain_text', content: '知识点缺漏' },
        placeholder: { tag: 'plain_text', content: '请描述知识点缺漏情况' },
        value: { text: formData?.knowledgeGaps || '' }
      },
      {
        tag: 'input',
        name: 'highlights',
        label: { tag: 'plain_text', content: '课堂亮点（一对一）' },
        placeholder: { tag: 'plain_text', content: '记录学生的精彩发言或表现' },
        value: { text: formData?.highlights || '' }
      },
      {
        tag: 'select_static',
        name: 'mood',
        placeholder: { tag: 'plain_text', content: '情绪状态（一对一）' },
        initial_option: formData?.mood || '',
        options: [
          { value: '热情饱满', text: { tag: 'plain_text', content: '热情饱满' } },
          { value: '稳定', text: { tag: 'plain_text', content: '稳定' } },
          { value: '疲惫', text: { tag: 'plain_text', content: '疲惫' } },
          { value: '畏难', text: { tag: 'plain_text', content: '畏难' } }
        ]
      },

      // ========== 考试模式字段 ==========
      { tag: 'hr' },
      { tag: 'div', text: { tag: 'lark_md', content: '**考试信息**' } },

      {
        tag: 'column_set', flex_mode: 'none', background_style: 'default',
        columns: [
          {
            tag: 'column', width: 'weighted', weight: 1, elements: [{
              tag: 'input',
              name: 'score',
              label: { tag: 'plain_text', content: '得分' },
              placeholder: { tag: 'plain_text', content: '得分' },
              value: { text: formData?.score || '' }
            }]
          },
          {
            tag: 'column', width: 'weighted', weight: 1, elements: [{
              tag: 'input',
              name: 'maxScore',
              label: { tag: 'plain_text', content: '满分' },
              placeholder: { tag: 'plain_text', content: '满分' },
              value: { text: formData?.maxScore || '' }
            }]
          }
        ]
      },
      {
        tag: 'input',
        name: 'examAnalysis',
        label: { tag: 'plain_text', content: '卷面分析' },
        placeholder: { tag: 'plain_text', content: '描述错题情况' },
        value: { text: formData?.examAnalysis || '' }
      },
      {
        tag: 'input',
        name: 'improvement',
        label: { tag: 'plain_text', content: '提分建议（一对一）' },
        placeholder: { tag: 'plain_text', content: '具体的课后训练动作' },
        value: { text: formData?.improvement || '' }
      },

      // ---- 提交按钮 ----
      { tag: 'hr' },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            name: 'submit',
            text: { tag: 'plain_text', content: '生成反馈' },
            type: 'primary',
            value: { action: 'generate_feedback' }
          }
        ]
      }
    ]
  }
}

/**
 * 结果显示卡片
 */
function resultCard({ studentName, feedback }) {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `${studentName} - 反馈已生成` }
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: feedback } },
      {
        tag: 'action',
        actions: [
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '复制反馈' },
            type: 'primary',
            value: { action: 'copy_feedback' }
          },
          {
            tag: 'button',
            text: { tag: 'plain_text', content: '继续反馈' },
            type: 'default',
            value: { action: 'new_feedback' }
          }
        ]
      }
    ]
  }
}

/**
 * 知识点分析结果卡片
 */
function knowledgePointsCard(points) {
  const list = points.map((p, i) => `${i + 1}. ${p.label}`).join('\n')

  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: `📝 识别到 ${points.length} 个知识点` }
    },
    elements: [
      { tag: 'div', text: { tag: 'lark_md', content: list } }
    ]
  }
}

/**
 * 帮助卡片
 */
function helpCard() {
  return {
    config: { wide_screen_mode: true },
    header: {
      title: { tag: 'plain_text', content: '🤖 课后反馈机器人 - 使用指南' }
    },
    elements: [
      { tag: 'markdown', content: [
        '**发送图片** — 自动分析试卷知识点',
        '',
        '**`/反馈`** — 弹出表单卡片，填写后生成课后反馈',
        '**`/学生`** — 查看学生列表',
        '**`/帮助`** — 显示本指南',
        '',
        '有任何问题直接 @我 即可'
      ].join('\n') }
    ]
  }
}

module.exports = { feedbackFormCard, resultCard, knowledgePointsCard, helpCard }

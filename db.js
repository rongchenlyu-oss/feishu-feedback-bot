const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'data.json')

/** 读取完整数据 */
function read() {
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return {}
  }
}

/** 写入完整数据 */
function write(data) {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

/**
 * 获取某个飞书用户的某个学生数据
 * userKey: 飞书用户的 open_id 或 chat_id
 */
function getStudent(userKey, studentId) {
  const data = read()
  return data[userKey]?.students?.[studentId] || null
}

function getAllStudents(userKey) {
  const data = read()
  return Object.values(data[userKey]?.students || {})
}

function saveStudent(userKey, student) {
  const data = read()
  if (!data[userKey]) data[userKey] = { students: {} }
  data[userKey].students[student.id] = student
  write(data)
}

function deleteStudent(userKey, studentId) {
  const data = read()
  if (data[userKey]?.students) {
    delete data[userKey].students[studentId]
    write(data)
  }
}

module.exports = { getStudent, getAllStudents, saveStudent, deleteStudent }

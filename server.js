const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据目录
const DATA_DIR = path.join(__dirname, 'data');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 中间件
app.use(express.json());
app.use(express.static('public'));

// 读取JSON文件的辅助函数
function readJSON(filename) {
  const filepath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filepath)) {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  }
  return null;
}

// 写入JSON文件的辅助函数
function writeJSON(filename, data) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
}

// API路由 - 家庭成员
app.get('/api/members', (req, res) => {
  const members = readJSON('members.json') || [];
  res.json(members);
});

app.post('/api/members', (req, res) => {
  const members = readJSON('members.json') || [];
  const newMember = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  members.push(newMember);
  writeJSON('members.json', members);
  res.json(newMember);
});

app.put('/api/members/:id', (req, res) => {
  const members = readJSON('members.json') || [];
  const index = members.findIndex(m => m.id === req.params.id);
  if (index !== -1) {
    members[index] = { ...members[index], ...req.body };
    writeJSON('members.json', members);
    res.json(members[index]);
  } else {
    res.status(404).json({ error: '成员不存在' });
  }
});

app.delete('/api/members/:id', (req, res) => {
  let members = readJSON('members.json') || [];
  members = members.filter(m => m.id !== req.params.id);
  writeJSON('members.json', members);
  res.json({ success: true });
});

// API路由 - 家庭成员属性定义
app.get('/api/attribute-definitions', (req, res) => {
  const definitions = readJSON('attribute-definitions.json') || [];
  res.json(definitions);
});

app.post('/api/attribute-definitions', (req, res) => {
  const definitions = readJSON('attribute-definitions.json') || [];
  const newDef = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  definitions.push(newDef);
  writeJSON('attribute-definitions.json', definitions);
  res.json(newDef);
});

app.delete('/api/attribute-definitions/:id', (req, res) => {
  let definitions = readJSON('attribute-definitions.json') || [];
  definitions = definitions.filter(d => d.id !== req.params.id);
  writeJSON('attribute-definitions.json', definitions);
  res.json({ success: true });
});

// API路由 - 成员属性值
app.get('/api/member-attributes', (req, res) => {
  const attributes = readJSON('member-attributes.json') || {};
  res.json(attributes);
});

app.put('/api/member-attributes/:memberId/:attrId', (req, res) => {
  const attributes = readJSON('member-attributes.json') || {};
  if (!attributes[req.params.memberId]) {
    attributes[req.params.memberId] = {};
  }
  attributes[req.params.memberId][req.params.attrId] = req.body.value;
  writeJSON('member-attributes.json', attributes);
  res.json({ success: true });
});

// API路由 - 待做任务
app.get('/api/todos', (req, res) => {
  const todos = readJSON('todos.json') || [];
  res.json(todos);
});

app.post('/api/todos', (req, res) => {
  const todos = readJSON('todos.json') || [];
  const newTodo = {
    id: Date.now().toString(),
    ...req.body,
    addedAt: new Date().toISOString()
  };
  todos.push(newTodo);
  writeJSON('todos.json', todos);
  res.json(newTodo);
});

app.put('/api/todos/:id', (req, res) => {
  const todos = readJSON('todos.json') || [];
  const index = todos.findIndex(t => t.id === req.params.id);
  if (index !== -1) {
    todos[index] = { ...todos[index], ...req.body };
    writeJSON('todos.json', todos);
    res.json(todos[index]);
  } else {
    res.status(404).json({ error: '任务不存在' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  let todos = readJSON('todos.json') || [];
  todos = todos.filter(t => t.id !== req.params.id);
  writeJSON('todos.json', todos);
  res.json({ success: true });
});

// API路由 - 周期任务
app.get('/api/periodic-tasks', (req, res) => {
  const tasks = readJSON('periodic-tasks.json') || [];
  res.json(tasks);
});

app.post('/api/periodic-tasks', (req, res) => {
  const tasks = readJSON('periodic-tasks.json') || [];
  const newTask = {
    id: Date.now().toString(),
    ...req.body,
    createdAt: new Date().toISOString(),
    generatedCount: 0
  };
  tasks.push(newTask);
  writeJSON('periodic-tasks.json', tasks);
  res.json(newTask);
});

app.put('/api/periodic-tasks/:id', (req, res) => {
  const tasks = readJSON('periodic-tasks.json') || [];
  const index = tasks.findIndex(t => t.id === req.params.id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...req.body };
    writeJSON('periodic-tasks.json', tasks);
    res.json(tasks[index]);
  } else {
    res.status(404).json({ error: '周期任务不存在' });
  }
});

app.delete('/api/periodic-tasks/:id', (req, res) => {
  let tasks = readJSON('periodic-tasks.json') || [];
  tasks = tasks.filter(t => t.id !== req.params.id);
  writeJSON('periodic-tasks.json', tasks);
  res.json({ success: true });
});

// 周期任务生成待做任务的功能
app.post('/api/periodic-tasks/:id/generate', (req, res) => {
  const tasks = readJSON('periodic-tasks.json') || [];
  const todos = readJSON('todos.json') || [];
  const task = tasks.find(t => t.id === req.params.id);
  
  if (!task) {
    return res.status(404).json({ error: '周期任务不存在' });
  }
  
  if (task.maxGenerations && task.generatedCount >= task.maxGenerations) {
    return res.status(400).json({ error: '已达到最大生成次数' });
  }
  
  const newTodo = {
    id: Date.now().toString(),
    content: task.content,
    addedBy: task.addedBy || '系统',
    executor: task.executor || '',
    status: '待处理',
    addedAt: new Date().toISOString(),
    fromPeriodicTask: task.id
  };
  
  todos.push(newTodo);
  task.generatedCount = (task.generatedCount || 0) + 1;
  
  writeJSON('todos.json', todos);
  writeJSON('periodic-tasks.json', tasks);
  
  res.json({ todo: newTodo, task });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

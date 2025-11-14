const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据目录
const DATA_DIR = path.join(__dirname, 'data');
const KNOWLEDGE_DIR = path.join(DATA_DIR, 'knowledge');
const KNOWLEDGE_IMAGES_DIR = path.join(KNOWLEDGE_DIR, 'images');

// 确保数据目录存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// 确保知识库目录存在
if (!fs.existsSync(KNOWLEDGE_DIR)) {
  fs.mkdirSync(KNOWLEDGE_DIR);
}

// 确保知识库图片目录存在
if (!fs.existsSync(KNOWLEDGE_IMAGES_DIR)) {
  fs.mkdirSync(KNOWLEDGE_IMAGES_DIR);
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

// 验证键名是否安全（防止原型污染）
function isSafeKey(key) {
  return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
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
  const memberId = req.params.memberId;
  const attrId = req.params.attrId;
  
  // 验证键名安全性
  if (!isSafeKey(memberId) || !isSafeKey(attrId)) {
    return res.status(400).json({ error: '无效的参数' });
  }
  
  const attributes = readJSON('member-attributes.json') || {};
  if (!attributes[memberId]) {
    attributes[memberId] = {};
  }
  attributes[memberId][attrId] = req.body.value;
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
  const deadlineDays = req.body.deadlineDays || 1;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);
  
  const newTodo = {
    id: Date.now().toString(),
    ...req.body,
    deadline: deadline.toISOString(),
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
    deadlineDays: req.body.deadlineDays || 1,
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
  
  const deadlineDays = task.deadlineDays || 1;
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + deadlineDays);
  
  const newTodo = {
    id: Date.now().toString(),
    content: task.content,
    addedBy: task.addedBy || '系统',
    executor: task.executor || '',
    status: '待处理',
    addedAt: new Date().toISOString(),
    deadline: deadline.toISOString(),
    fromPeriodicTask: task.id
  };
  
  todos.push(newTodo);
  task.generatedCount = (task.generatedCount || 0) + 1;
  
  writeJSON('todos.json', todos);
  writeJSON('periodic-tasks.json', tasks);
  
  res.json({ todo: newTodo, task });
});

// ========== 知识库 API ==========

// 扫描知识库目录结构
function scanKnowledgeBase() {
  const categories = [];
  
  if (!fs.existsSync(KNOWLEDGE_DIR)) {
    return categories;
  }
  
  const rootItems = fs.readdirSync(KNOWLEDGE_DIR, { withFileTypes: true });
  
  for (const item of rootItems) {
    if (item.isDirectory() && item.name !== 'images') {
      const categoryPath = path.join(KNOWLEDGE_DIR, item.name);
      const category = {
        name: item.name,
        path: item.name,
        children: scanCategory(categoryPath, item.name)
      };
      categories.push(category);
    }
  }
  
  return categories;
}

// 递归扫描分类目录
function scanCategory(dirPath, relativePath) {
  const items = [];
  
  if (!fs.existsSync(dirPath)) {
    return items;
  }
  
  const dirItems = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const item of dirItems) {
    if (item.isDirectory()) {
      // 子目录
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = `${relativePath}/${item.name}`;
      items.push({
        type: 'category',
        name: item.name,
        path: itemRelativePath,
        children: scanCategory(itemPath, itemRelativePath)
      });
    } else if (item.isFile() && item.name.endsWith('.json')) {
      // JSON文件作为二级分类
      const itemPath = path.join(dirPath, item.name);
      const itemRelativePath = `${relativePath}/${item.name}`;
      const categoryName = item.name.replace('.json', '');
      
      try {
        const data = JSON.parse(fs.readFileSync(itemPath, 'utf-8'));
        items.push({
          type: 'file',
          name: categoryName,
          path: itemRelativePath,
          knowledgeItems: data.items || []
        });
      } catch (error) {
        console.error(`读取知识库文件失败: ${itemPath}`, error);
      }
    }
  }
  
  return items;
}

// 获取知识库结构
app.get('/api/knowledge/structure', (req, res) => {
  try {
    const structure = scanKnowledgeBase();
    res.json(structure);
  } catch (error) {
    console.error('获取知识库结构失败:', error);
    res.status(500).json({ error: '获取知识库结构失败' });
  }
});

// 获取知识库配置（当前学习人、目标属性）
app.get('/api/knowledge/config', (req, res) => {
  const config = readJSON('knowledge-config.json') || {
    currentLearners: [],
    targetAttributes: {}
  };
  res.json(config);
});

// 保存知识库配置
app.put('/api/knowledge/config', (req, res) => {
  writeJSON('knowledge-config.json', req.body);
  res.json({ success: true });
});

// 创建根分类（大分类）
app.post('/api/knowledge/category', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '分类名称不能为空' });
  }
  
  const categoryPath = path.join(KNOWLEDGE_DIR, name);
  
  if (fs.existsSync(categoryPath)) {
    return res.status(400).json({ error: '分类已存在' });
  }
  
  fs.mkdirSync(categoryPath, { recursive: true });
  res.json({ success: true });
});

// 删除分类
app.delete('/api/knowledge/category', (req, res) => {
  const { categoryPath } = req.body;
  
  if (!categoryPath) {
    return res.status(400).json({ error: '分类路径不能为空' });
  }
  
  const fullPath = path.join(KNOWLEDGE_DIR, categoryPath);
  
  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: '分类不存在' });
  }
  
  // 递归删除目录
  fs.rmSync(fullPath, { recursive: true, force: true });
  res.json({ success: true });
});

// 创建子分类或知识项文件
app.post('/api/knowledge/subcategory', (req, res) => {
  const { parentPath, name, isFile } = req.body;
  
  if (!parentPath || !name) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  const parentFullPath = path.join(KNOWLEDGE_DIR, parentPath);
  
  if (!fs.existsSync(parentFullPath)) {
    return res.status(404).json({ error: '父分类不存在' });
  }
  
  if (isFile) {
    // 创建知识项JSON文件
    const filePath = path.join(parentFullPath, `${name}.json`);
    if (fs.existsSync(filePath)) {
      return res.status(400).json({ error: '文件已存在' });
    }
    writeJSON(`knowledge/${parentPath}/${name}.json`, { items: [] });
  } else {
    // 创建子目录
    const dirPath = path.join(parentFullPath, name);
    if (fs.existsSync(dirPath)) {
      return res.status(400).json({ error: '目录已存在' });
    }
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  res.json({ success: true });
});

// 获取知识项列表
app.get('/api/knowledge/items', (req, res) => {
  const { filePath } = req.query;
  
  if (!filePath) {
    return res.status(400).json({ error: '文件路径不能为空' });
  }
  
  const data = readJSON(`knowledge/${filePath}`) || { items: [] };
  res.json(data.items || []);
});

// 添加或更新知识项
app.post('/api/knowledge/item', (req, res) => {
  const { filePath, item } = req.body;
  
  if (!filePath || !item) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  const data = readJSON(`knowledge/${filePath}`) || { items: [] };
  
  if (item.id) {
    // 更新现有项
    const index = data.items.findIndex(i => i.id === item.id);
    if (index !== -1) {
      data.items[index] = item;
    }
  } else {
    // 添加新项
    item.id = Date.now().toString();
    item.createdAt = new Date().toISOString();
    data.items.push(item);
  }
  
  writeJSON(`knowledge/${filePath}`, data);
  res.json(item);
});

// 删除知识项
app.delete('/api/knowledge/item', (req, res) => {
  const { filePath, itemId } = req.body;
  
  if (!filePath || !itemId) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  const data = readJSON(`knowledge/${filePath}`) || { items: [] };
  data.items = data.items.filter(i => i.id !== itemId);
  
  writeJSON(`knowledge/${filePath}`, data);
  res.json({ success: true });
});

// 增加学习次数
app.post('/api/knowledge/item/learn', (req, res) => {
  const { filePath, itemId, learners, targetAttributes } = req.body;
  
  if (!filePath || !itemId) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  const data = readJSON(`knowledge/${filePath}`) || { items: [] };
  const item = data.items.find(i => i.id === itemId);
  
  if (!item) {
    return res.status(404).json({ error: '知识项不存在' });
  }
  
  // 更新知识项
  item.learnCount = (item.learnCount || 0) + 1;
  item.lastLearnTime = new Date().toISOString();
  
  writeJSON(`knowledge/${filePath}`, data);
  
  // 更新学习人属性
  if (learners && learners.length > 0 && targetAttributes) {
    const memberAttributes = readJSON('member-attributes.json') || {};
    
    for (const learnerId of learners) {
      if (!memberAttributes[learnerId]) {
        memberAttributes[learnerId] = {};
      }
      
      for (const attrId of Object.keys(targetAttributes)) {
        const currentValue = memberAttributes[learnerId][attrId] || 0;
        memberAttributes[learnerId][attrId] = parseInt(currentValue) + 1;
      }
    }
    
    writeJSON('member-attributes.json', memberAttributes);
  }
  
  res.json(item);
});

// 增加忘记次数
app.post('/api/knowledge/item/forget', (req, res) => {
  const { filePath, itemId } = req.body;
  
  if (!filePath || !itemId) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  const data = readJSON(`knowledge/${filePath}`) || { items: [] };
  const item = data.items.find(i => i.id === itemId);
  
  if (!item) {
    return res.status(404).json({ error: '知识项不存在' });
  }
  
  item.forgetCount = (item.forgetCount || 0) + 1;
  
  writeJSON(`knowledge/${filePath}`, data);
  res.json(item);
});

// 导入知识数据
app.post('/api/knowledge/import', (req, res) => {
  const { data } = req.body;
  
  if (!Array.isArray(data)) {
    return res.status(400).json({ error: '数据格式错误' });
  }
  
  let imported = 0;
  
  for (const item of data) {
    const { levelRootName, level1Name, level2Name, level3Name, ...knowledgeItem } = item;
    
    if (!levelRootName || !level1Name) {
      continue;
    }
    
    // 构建路径
    let filePath = `${levelRootName}/${level1Name}`;
    
    // 确保目录存在
    const rootPath = path.join(KNOWLEDGE_DIR, levelRootName);
    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath, { recursive: true });
    }
    
    const level1Path = path.join(rootPath, level1Name);
    if (!fs.existsSync(level1Path)) {
      fs.mkdirSync(level1Path, { recursive: true });
    }
    
    // 如果有level2Name，添加到路径
    if (level2Name) {
      const level2Path = path.join(level1Path, level2Name);
      if (!fs.existsSync(level2Path)) {
        fs.mkdirSync(level2Path, { recursive: true });
      }
      filePath = `${levelRootName}/${level1Name}/${level2Name}`;
      
      // 如果有level3Name，这是文件名
      if (level3Name) {
        filePath = `${filePath}/${level3Name}.json`;
      } else {
        // level2Name是文件名
        filePath = `${levelRootName}/${level1Name}/${level2Name}.json`;
      }
    } else {
      // level1Name是文件名
      filePath = `${levelRootName}/${level1Name}.json`;
    }
    
    // 读取现有数据
    const fileData = readJSON(`knowledge/${filePath}`) || { items: [] };
    
    // 添加知识项
    knowledgeItem.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    knowledgeItem.createdAt = new Date().toISOString();
    knowledgeItem.learnCount = knowledgeItem.learnCount || 0;
    knowledgeItem.forgetCount = knowledgeItem.forgetCount || 0;
    
    fileData.items.push(knowledgeItem);
    
    writeJSON(`knowledge/${filePath}`, fileData);
    imported++;
  }
  
  res.json({ success: true, imported });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

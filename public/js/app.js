// 全局状态
const AppState = {
  currentPage: 'members',
  members: [],
  attributeDefinitions: [],
  memberAttributes: {},
  todos: [],
  periodicTasks: [],
  knowledgeStructure: [],
  knowledgeConfig: { currentLearners: [], targetAttributes: {} },
  knowledgeSubPage: 'categories', // categories, free-learn, import
  currentKnowledgePath: null,
  freeLearnItems: [],
  freeLearnIndex: 0,
  freeLearnShowDetail: false
};

// API 辅助函数
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API调用失败:', error);
    alert('操作失败，请重试');
    throw error;
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigation();
  setupModal();
  await loadInitialData();
  renderPage('members');
});

// 设置导航
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const page = item.dataset.page;
      
      // 处理游戏大厅的展开/收起
      if (page === 'games') {
        item.classList.toggle('expanded');
        const submenu = document.getElementById('gamesSubmenu');
        submenu.classList.toggle('show');
        return;
      }
      
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      AppState.currentPage = page;
      renderPage(page);
    });
  });
  
  // 设置游戏子菜单点击事件
  document.querySelectorAll('.nav-submenu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const gameId = item.dataset.game;
      openGameWindow(gameId);
    });
  });
}

// 打开游戏窗口
function openGameWindow(gameId) {
  const gameUrls = {
    'spider-run': '/games/spider-run.html',
    '2048': '/games/2048.html',
    'starship-typing': '/games/starship-typing.html',
    'scavenger': '/games/scavenger.html',
    'hanzi-master': '/games/hanzi-master.html',
    'word-expert': '/games/word-expert.html'
  };
  
  const url = gameUrls[gameId];
  if (url) {
    window.open(url, '_blank', 'width=1200,height=800,menubar=no,toolbar=no,location=no,status=no');
  }
}

// 设置模态框
function setupModal() {
  const modal = document.getElementById('modal');
  const closeBtn = modal.querySelector('.close');
  
  closeBtn.onclick = () => {
    modal.classList.remove('show');
  };
  
  window.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  };
}

// 显示模态框
function showModal(content) {
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = content;
  modal.classList.add('show');
}

// 隐藏模态框
function hideModal() {
  document.getElementById('modal').classList.remove('show');
}

// 加载初始数据
async function loadInitialData() {
  try {
    AppState.members = await apiCall('/api/members');
    AppState.attributeDefinitions = await apiCall('/api/attribute-definitions');
    AppState.memberAttributes = await apiCall('/api/member-attributes');
    AppState.todos = await apiCall('/api/todos');
    AppState.periodicTasks = await apiCall('/api/periodic-tasks');
  } catch (error) {
    console.error('加载数据失败:', error);
  }
}

// 渲染页面
function renderPage(page) {
  switch (page) {
    case 'members':
      renderMembersPage();
      break;
    case 'todos':
      renderTodosPage();
      break;
    case 'periodic':
      renderPeriodicPage();
      break;
    case 'knowledge':
      renderKnowledgePage();
      break;
  }
}

// ========== 家庭成员页面 ==========
async function renderMembersPage() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  subNav.innerHTML = `
    <button class="sub-nav-btn primary" onclick="addMember()">➕ 添加家庭成员</button>
    <button class="sub-nav-btn primary" onclick="addAttributeDefinition()">➕ 添加属性类型</button>
  `;
  
  AppState.members = await apiCall('/api/members');
  AppState.attributeDefinitions = await apiCall('/api/attribute-definitions');
  AppState.memberAttributes = await apiCall('/api/member-attributes');
  
  if (AppState.members.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <div class="empty-state-text">还没有家庭成员，点击上方按钮添加吧</div>
      </div>
    `;
    return;
  }
  
  if (AppState.attributeDefinitions.length === 0) {
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">家庭成员列表</h2>
        </div>
        <div>
          ${AppState.members.map(member => `
            <div class="list-item">
              <div class="item-info">
                <span class="item-label">${member.name}</span>
                <span class="item-value">${member.relationship || ''}</span>
              </div>
              <div class="item-actions">
                <button class="btn btn-sm btn-info" onclick="editMember('${member.id}')">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteMember('${member.id}')">删除</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
      <div class="empty-state" style="margin-top: 20px;">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">还没有属性类型，点击上方按钮添加吧</div>
      </div>
    `;
    return;
  }
  
  // 显示成员属性表格（横轴是家庭成员，纵轴是属性）
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">家庭成员属性管理</h2>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>属性 / 成员</th>
              ${AppState.members.map(member => `
                <th>
                  ${member.name}
                  <button class="btn btn-sm btn-info" onclick="editMember('${member.id}')" style="margin-left: 8px;">编辑</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteMember('${member.id}')" style="margin-left: 4px;">删除</button>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${AppState.attributeDefinitions.map(def => `
              <tr>
                <td>
                  <strong>${def.name} (${def.type === 'integer' ? '整数' : '字符串'})</strong>
                  <button class="btn btn-sm btn-danger" onclick="deleteAttributeDefinition('${def.id}')" style="margin-left: 8px;">删除</button>
                </td>
                ${AppState.members.map(member => {
                  const value = AppState.memberAttributes[member.id]?.[def.id] || (def.type === 'integer' ? 0 : '');
                  return `
                    <td>
                      ${def.type === 'integer' 
                        ? `
                          <div class="attr-value-control">
                            <button class="attr-btn minus" onclick="adjustAttribute('${member.id}', '${def.id}', -1)">−</button>
                            <span class="attr-value">${value}</span>
                            <button class="attr-btn plus" onclick="adjustAttribute('${member.id}', '${def.id}', 1)">+</button>
                          </div>
                        `
                        : `
                          <input type="text" 
                            class="form-input" 
                            value="${value}" 
                            onchange="updateAttribute('${member.id}', '${def.id}', this.value)"
                            style="font-size: 16px;">
                        `
                      }
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function addMember() {
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">添加家庭成员</h2>
    <form onsubmit="submitMember(event)">
      <div class="form-group">
        <label class="form-label">姓名 *</label>
        <input type="text" name="name" class="form-input" required>
      </div>
      <div class="form-group">
        <label class="form-label">关系</label>
        <input type="text" name="relationship" class="form-input" placeholder="如：父亲、母亲、儿子、女儿">
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <textarea name="note" class="form-textarea"></textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">确定添加</button>
    </form>
  `);
}

function editMember(id) {
  const member = AppState.members.find(m => m.id === id);
  if (!member) return;
  
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">编辑家庭成员</h2>
    <form onsubmit="submitEditMember(event, '${id}')">
      <div class="form-group">
        <label class="form-label">姓名 *</label>
        <input type="text" name="name" class="form-input" value="${member.name}" required>
      </div>
      <div class="form-group">
        <label class="form-label">关系</label>
        <input type="text" name="relationship" class="form-input" value="${member.relationship || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">备注</label>
        <textarea name="note" class="form-textarea">${member.note || ''}</textarea>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">保存修改</button>
    </form>
  `);
}

async function submitMember(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name'),
    relationship: formData.get('relationship'),
    note: formData.get('note')
  };
  
  await apiCall('/api/members', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  hideModal();
  renderMembersPage();
}

async function submitEditMember(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name'),
    relationship: formData.get('relationship'),
    note: formData.get('note')
  };
  
  await apiCall(`/api/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  
  hideModal();
  renderMembersPage();
}

async function deleteMember(id) {
  if (!confirm('确定要删除这个成员吗？')) return;
  
  await apiCall(`/api/members/${id}`, {
    method: 'DELETE'
  });
  
  renderMembersPage();
}

// ========== 家庭成员属性相关函数 ==========
function addAttributeDefinition() {
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">添加属性类型</h2>
    <form onsubmit="submitAttributeDefinition(event)">
      <div class="form-group">
        <label class="form-label">属性名称 *</label>
        <input type="text" name="name" class="form-input" required placeholder="如：积分、身高、爱好">
      </div>
      <div class="form-group">
        <label class="form-label">数据类型 *</label>
        <select name="type" class="form-select" required>
          <option value="integer">整数（可用+/-调整）</option>
          <option value="string">字符串（可直接编辑）</option>
        </select>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">确定添加</button>
    </form>
  `);
}

async function submitAttributeDefinition(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    name: formData.get('name'),
    type: formData.get('type')
  };
  
  await apiCall('/api/attribute-definitions', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  hideModal();
  renderMembersPage();
}

async function deleteAttributeDefinition(id) {
  if (!confirm('确定要删除这个属性类型吗？这将删除所有成员的该属性值。')) return;
  
  await apiCall(`/api/attribute-definitions/${id}`, {
    method: 'DELETE'
  });
  
  renderMembersPage();
}

async function adjustAttribute(memberId, attrId, delta) {
  const currentValue = AppState.memberAttributes[memberId]?.[attrId] || 0;
  const newValue = parseInt(currentValue) + delta;
  
  await apiCall(`/api/member-attributes/${memberId}/${attrId}`, {
    method: 'PUT',
    body: JSON.stringify({ value: newValue })
  });
  
  renderMembersPage();
}

async function updateAttribute(memberId, attrId, value) {
  await apiCall(`/api/member-attributes/${memberId}/${attrId}`, {
    method: 'PUT',
    body: JSON.stringify({ value })
  });
  
  AppState.memberAttributes[memberId] = AppState.memberAttributes[memberId] || {};
  AppState.memberAttributes[memberId][attrId] = value;
}

// ========== 待做任务页面 ==========
async function renderTodosPage() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  subNav.innerHTML = `
    <button class="sub-nav-btn primary" onclick="addTodo()">➕ 添加任务</button>
  `;
  
  AppState.todos = await apiCall('/api/todos');
  AppState.members = await apiCall('/api/members');
  
  if (AppState.todos.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✓</div>
        <div class="empty-state-text">还没有待做任务，点击上方按钮添加吧</div>
      </div>
    `;
    return;
  }
  
  // 按状态分组
  const pending = AppState.todos.filter(t => t.status === '待处理');
  const inProgress = AppState.todos.filter(t => t.status === '进行中');
  const done = AppState.todos.filter(t => t.status === '已完成');
  
  contentArea.innerHTML = `
    ${renderTodoSection('待处理', pending, 'status-pending')}
    ${renderTodoSection('进行中', inProgress, 'status-progress')}
    ${renderTodoSection('已完成', done, 'status-done')}
  `;
}

function renderTodoSection(title, todos, statusClass) {
  if (todos.length === 0) return '';
  
  return `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">${title} (${todos.length})</h2>
      </div>
      <div>
        ${todos.map(todo => `
          <div class="list-item" style="flex-direction: column; align-items: flex-start;">
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 10px;">
              <div>
                <span class="status-badge ${statusClass}">${todo.status}</span>
                <strong style="margin-left: 12px; font-size: 18px;">${todo.content}</strong>
              </div>
              <div class="item-actions">
                <button class="btn btn-sm btn-info" onclick="editTodo('${todo.id}')">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deleteTodo('${todo.id}')">删除</button>
              </div>
            </div>
            <div style="color: #888; font-size: 16px;">
              添加人: ${todo.addedBy || '未知'} | 
              执行人: ${todo.executor || '未指定'} | 
              添加时间: ${new Date(todo.addedAt).toLocaleString('zh-CN')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function addTodo() {
  const memberOptions = AppState.members.map(m => 
    `<option value="${m.name}">${m.name}</option>`
  ).join('');
  
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">添加待做任务</h2>
    <form onsubmit="submitTodo(event)">
      <div class="form-group">
        <label class="form-label">任务内容 *</label>
        <textarea name="content" class="form-textarea" required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">添加人</label>
        <select name="addedBy" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">执行人</label>
        <select name="executor" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">任务状态</label>
        <select name="status" class="form-select">
          <option value="待处理">待处理</option>
          <option value="进行中">进行中</option>
          <option value="已完成">已完成</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">截止时间（天数）</label>
        <input type="number" name="deadlineDays" class="form-input" value="1" min="1" placeholder="相对当前时间的天数">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">确定添加</button>
    </form>
  `);
}

function editTodo(id) {
  const todo = AppState.todos.find(t => t.id === id);
  if (!todo) return;
  
  const memberOptions = AppState.members.map(m => 
    `<option value="${m.name}" ${todo.addedBy === m.name || todo.executor === m.name ? 'selected' : ''}>${m.name}</option>`
  ).join('');
  
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">编辑待做任务</h2>
    <form onsubmit="submitEditTodo(event, '${id}')">
      <div class="form-group">
        <label class="form-label">任务内容 *</label>
        <textarea name="content" class="form-textarea" required>${todo.content}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">添加人</label>
        <select name="addedBy" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">执行人</label>
        <select name="executor" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">任务状态</label>
        <select name="status" class="form-select">
          <option value="待处理" ${todo.status === '待处理' ? 'selected' : ''}>待处理</option>
          <option value="进行中" ${todo.status === '进行中' ? 'selected' : ''}>进行中</option>
          <option value="已完成" ${todo.status === '已完成' ? 'selected' : ''}>已完成</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">截止时间（天数）</label>
        <input type="number" name="deadlineDays" class="form-input" value="1" min="1" placeholder="相对当前时间的天数">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">保存修改</button>
    </form>
  `);
}

async function submitTodo(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    content: formData.get('content'),
    addedBy: formData.get('addedBy'),
    executor: formData.get('executor'),
    status: formData.get('status'),
    deadlineDays: parseInt(formData.get('deadlineDays')) || 1
  };
  
  await apiCall('/api/todos', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  hideModal();
  renderTodosPage();
}

async function submitEditTodo(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    content: formData.get('content'),
    addedBy: formData.get('addedBy'),
    executor: formData.get('executor'),
    status: formData.get('status'),
    deadlineDays: parseInt(formData.get('deadlineDays')) || 1
  };
  
  await apiCall(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  
  hideModal();
  renderTodosPage();
}

async function deleteTodo(id) {
  if (!confirm('确定要删除这个任务吗？')) return;
  
  await apiCall(`/api/todos/${id}`, {
    method: 'DELETE'
  });
  
  renderTodosPage();
}

// ========== 周期任务页面 ==========
async function renderPeriodicPage() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  subNav.innerHTML = `
    <button class="sub-nav-btn primary" onclick="addPeriodicTask()">➕ 添加周期任务</button>
  `;
  
  AppState.periodicTasks = await apiCall('/api/periodic-tasks');
  AppState.members = await apiCall('/api/members');
  
  if (AppState.periodicTasks.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔄</div>
        <div class="empty-state-text">还没有周期任务，点击上方按钮添加吧</div>
      </div>
    `;
    return;
  }
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">周期任务列表</h2>
      </div>
      <div>
        ${AppState.periodicTasks.map(task => `
          <div class="list-item" style="flex-direction: column; align-items: flex-start;">
            <div style="display: flex; justify-content: space-between; width: 100%; margin-bottom: 10px;">
              <div>
                <strong style="font-size: 18px;">${task.content}</strong>
              </div>
              <div class="item-actions">
                <button class="btn btn-sm btn-success" onclick="generateTodoFromPeriodic('${task.id}')">生成任务</button>
                <button class="btn btn-sm btn-info" onclick="editPeriodicTask('${task.id}')">编辑</button>
                <button class="btn btn-sm btn-danger" onclick="deletePeriodicTask('${task.id}')">删除</button>
              </div>
            </div>
            <div style="color: #888; font-size: 16px;">
              周期: ${task.period || '未设置'} | 
              执行人: ${task.executor || '未指定'} | 
              已生成: ${task.generatedCount || 0}/${task.maxGenerations || '∞'}次
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function addPeriodicTask() {
  const memberOptions = AppState.members.map(m => 
    `<option value="${m.name}">${m.name}</option>`
  ).join('');
  
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">添加周期任务</h2>
    <form onsubmit="submitPeriodicTask(event)">
      <div class="form-group">
        <label class="form-label">任务内容 *</label>
        <textarea name="content" class="form-textarea" required></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">添加人</label>
        <select name="addedBy" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">执行人</label>
        <select name="executor" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">派生周期 *</label>
        <select name="period" class="form-select" required>
          <option value="每日早上5点">每日早上5点</option>
          <option value="每周今天">每周今天</option>
          <option value="每周周一">每周周一</option>
          <option value="每月1号">每月1号</option>
          <option value="每月今天">每月今天</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">总派生次数</label>
        <input type="number" name="maxGenerations" class="form-input" placeholder="留空表示无限次">
      </div>
      <div class="form-group">
        <label class="form-label">任务截止时间（天数）</label>
        <input type="number" name="deadlineDays" class="form-input" value="1" min="1" placeholder="生成任务的截止天数">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">确定添加</button>
    </form>
  `);
}

function editPeriodicTask(id) {
  const task = AppState.periodicTasks.find(t => t.id === id);
  if (!task) return;
  
  const memberOptions = AppState.members.map(m => 
    `<option value="${m.name}">${m.name}</option>`
  ).join('');
  
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">编辑周期任务</h2>
    <form onsubmit="submitEditPeriodicTask(event, '${id}')">
      <div class="form-group">
        <label class="form-label">任务内容 *</label>
        <textarea name="content" class="form-textarea" required>${task.content}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">添加人</label>
        <select name="addedBy" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">执行人</label>
        <select name="executor" class="form-select">
          <option value="">请选择</option>
          ${memberOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">派生周期 *</label>
        <select name="period" class="form-select" required>
          <option value="每日早上5点" ${task.period === '每日早上5点' ? 'selected' : ''}>每日早上5点</option>
          <option value="每周今天" ${task.period === '每周今天' ? 'selected' : ''}>每周今天</option>
          <option value="每周周一" ${task.period === '每周周一' ? 'selected' : ''}>每周周一</option>
          <option value="每月1号" ${task.period === '每月1号' ? 'selected' : ''}>每月1号</option>
          <option value="每月今天" ${task.period === '每月今天' ? 'selected' : ''}>每月今天</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">总派生次数</label>
        <input type="number" name="maxGenerations" class="form-input" value="${task.maxGenerations || ''}" placeholder="留空表示无限次">
      </div>
      <div class="form-group">
        <label class="form-label">任务截止时间（天数）</label>
        <input type="number" name="deadlineDays" class="form-input" value="${task.deadlineDays || 1}" min="1" placeholder="生成任务的截止天数">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">保存修改</button>
    </form>
  `);
}

async function submitPeriodicTask(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    content: formData.get('content'),
    addedBy: formData.get('addedBy'),
    executor: formData.get('executor'),
    period: formData.get('period'),
    maxGenerations: formData.get('maxGenerations') ? parseInt(formData.get('maxGenerations')) : null,
    deadlineDays: parseInt(formData.get('deadlineDays')) || 1
  };
  
  await apiCall('/api/periodic-tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  hideModal();
  renderPeriodicPage();
}

async function submitEditPeriodicTask(e, id) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = {
    content: formData.get('content'),
    addedBy: formData.get('addedBy'),
    executor: formData.get('executor'),
    period: formData.get('period'),
    maxGenerations: formData.get('maxGenerations') ? parseInt(formData.get('maxGenerations')) : null,
    deadlineDays: parseInt(formData.get('deadlineDays')) || 1
  };
  
  await apiCall(`/api/periodic-tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  
  hideModal();
  renderPeriodicPage();
}

async function deletePeriodicTask(id) {
  if (!confirm('确定要删除这个周期任务吗？')) return;
  
  await apiCall(`/api/periodic-tasks/${id}`, {
    method: 'DELETE'
  });
  
  renderPeriodicPage();
}

async function generateTodoFromPeriodic(id) {
  try {
    await apiCall(`/api/periodic-tasks/${id}/generate`, {
      method: 'POST'
    });
    alert('任务生成成功！');
    renderPeriodicPage();
  } catch (error) {
    console.error('生成任务失败:', error);
  }
}

// ========== 知识库页面 ==========
async function renderKnowledgePage() {
  // 加载知识库数据
  await loadKnowledgeData();
  
  // 根据子页面渲染
  switch (AppState.knowledgeSubPage) {
    case 'categories':
      renderKnowledgeCategories();
      break;
    case 'free-learn':
      renderFreeLearning();
      break;
    case 'import':
      renderKnowledgeImport();
      break;
  }
}

async function loadKnowledgeData() {
  try {
    AppState.knowledgeStructure = await apiCall('/api/knowledge/structure');
    AppState.knowledgeConfig = await apiCall('/api/knowledge/config');
    AppState.members = await apiCall('/api/members');
    AppState.attributeDefinitions = await apiCall('/api/attribute-definitions');
  } catch (error) {
    console.error('加载知识库数据失败:', error);
  }
}

function renderKnowledgeCategories() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  // 二级导航栏
  subNav.innerHTML = `
    <div style="display: flex; gap: 15px; align-items: center; flex-wrap: wrap; width: 100%;">
      <div style="display: flex; gap: 10px; align-items: center;">
        <label style="font-size: 16px; font-weight: 500;">当前学习人:</label>
        <select id="currentLearnersSelect" multiple class="form-select" style="min-width: 150px; height: 40px;" onchange="updateKnowledgeConfig()">
          ${AppState.members.map(m => `
            <option value="${m.id}" ${AppState.knowledgeConfig.currentLearners.includes(m.id) ? 'selected' : ''}>
              ${m.name}
            </option>
          `).join('')}
        </select>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <label style="font-size: 16px; font-weight: 500;">目标属性:</label>
        <select id="targetAttributesSelect" multiple class="form-select" style="min-width: 150px; height: 40px;" onchange="updateKnowledgeConfig()">
          ${AppState.attributeDefinitions.map(attr => `
            <option value="${attr.id}" ${AppState.knowledgeConfig.targetAttributes[attr.id] ? 'selected' : ''}>
              ${attr.name}
            </option>
          `).join('')}
        </select>
      </div>
      <div style="flex: 1;"></div>
      <button class="sub-nav-btn" onclick="showKnowledgeSubPage('free-learn')" style="background: #10b981; color: white;">🎯 自由学习</button>
      <button class="sub-nav-btn" onclick="showKnowledgeSubPage('import')" style="background: #3b82f6; color: white;">📥 知识录入</button>
    </div>
  `;
  
  if (AppState.currentKnowledgePath) {
    // 显示知识点列表
    renderKnowledgeItems();
  } else {
    // 显示知识分类
    renderKnowledgeStructure();
  }
}

function renderKnowledgeStructure() {
  const contentArea = document.getElementById('contentArea');
  
  if (AppState.knowledgeStructure.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <div class="empty-state-text">还没有知识库分类，点击下方按钮添加</div>
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <button class="btn btn-primary" onclick="addRootCategory()">➕ 添加知识大分类</button>
      </div>
    `;
    return;
  }
  
  contentArea.innerHTML = `
    <div class="knowledge-categories">
      ${AppState.knowledgeStructure.map(cat => `
        <div class="knowledge-category-card" onclick="enterCategory('${cat.name}', ${JSON.stringify(cat).replace(/"/g, '&quot;')})">
          <div class="category-icon">📚</div>
          <div class="category-name">${cat.name}</div>
          <button class="category-delete-btn" onclick="event.stopPropagation(); deleteRootCategory('${cat.name}')">×</button>
        </div>
      `).join('')}
      <div class="knowledge-category-card add-category" onclick="addRootCategory()">
        <div class="category-icon">➕</div>
        <div class="category-name">添加分类</div>
      </div>
    </div>
  `;
}

function renderKnowledgeItems() {
  const contentArea = document.getElementById('contentArea');
  const pathParts = AppState.currentKnowledgePath.split('/');
  
  // 找到当前节点
  let currentNode = null;
  let currentData = AppState.knowledgeStructure;
  
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i];
    currentNode = currentData.find(item => item.name === part || item.path === pathParts.slice(0, i + 1).join('/'));
    if (currentNode) {
      currentData = currentNode.children || [];
    }
  }
  
  const breadcrumb = pathParts.map((part, index) => {
    const partPath = pathParts.slice(0, index + 1).join('/');
    return `<span class="breadcrumb-item" onclick="navigateToPath('${index === 0 ? '' : partPath}')">${part}</span>`;
  }).join(' / ');
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <button class="btn btn-sm" onclick="navigateToPath('')" style="margin-right: 10px;">← 返回</button>
          <span style="font-size: 18px;">${breadcrumb}</span>
        </div>
        <div>
          <button class="btn btn-sm btn-primary" onclick="addSubCategory()">➕ 添加子分类</button>
        </div>
      </div>
      <div class="knowledge-tree">
        ${currentData && currentData.length > 0 ? renderKnowledgeTree(currentData) : '<div style="padding: 20px; text-align: center; color: #888;">暂无内容</div>'}
      </div>
    </div>
  `;
}

function renderKnowledgeTree(items) {
  return items.map(item => {
    if (item.type === 'category') {
      return `
        <div class="knowledge-tree-item">
          <div class="tree-item-header" onclick="navigateToPath('${item.path}')">
            <span class="tree-icon">📁</span>
            <span class="tree-name">${item.name}</span>
          </div>
        </div>
      `;
    } else if (item.type === 'file') {
      return `
        <div class="knowledge-tree-item">
          <div class="tree-item-header" onclick="viewKnowledgeFile('${item.path}', '${item.name}')">
            <span class="tree-icon">📄</span>
            <span class="tree-name">${item.name}</span>
            <span class="tree-count">(${item.knowledgeItems.length})</span>
          </div>
        </div>
      `;
    }
  }).join('');
}

async function viewKnowledgeFile(filePath, categoryName) {
  try {
    const items = await apiCall(`/api/knowledge/items?filePath=${encodeURIComponent(filePath)}`);
    showKnowledgeItemsList(filePath, categoryName, items);
  } catch (error) {
    console.error('加载知识项失败:', error);
  }
}

function showKnowledgeItemsList(filePath, categoryName, items) {
  showModal(`
    <div style="max-width: 900px;">
      <h2 style="margin-bottom: 20px; font-size: 24px;">${categoryName} - 知识点列表</h2>
      <button class="btn btn-sm btn-primary" onclick="addKnowledgeItem('${filePath}')" style="margin-bottom: 15px;">➕ 添加知识点</button>
      ${items.length === 0 ? '<p style="color: #888; text-align: center; padding: 20px;">暂无知识点</p>' : `
        <div style="max-height: 500px; overflow-y: auto;">
          ${items.map(item => `
            <div class="knowledge-item-card">
              <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                  <h3 style="font-size: 20px; margin-bottom: 10px;">${item.name}</h3>
                  ${item.brief ? `<p style="color: #666; margin-bottom: 8px;"><strong>概括:</strong> ${item.brief}</p>` : ''}
                  ${item.detail ? `<p style="color: #666; margin-bottom: 8px;"><strong>详情:</strong> ${item.detail}</p>` : ''}
                  ${item.url ? `<p style="color: #666; margin-bottom: 8px;"><strong>链接:</strong> <a href="${item.url}" target="_blank">${item.url}</a></p>` : ''}
                  <div style="margin-top: 10px; color: #888; font-size: 14px;">
                    学会: ${item.learnCount || 0}次 | 忘记: ${item.forgetCount || 0}次
                    ${item.lastLearnTime ? ` | 最后学习: ${new Date(item.lastLearnTime).toLocaleString('zh-CN')}` : ''}
                  </div>
                </div>
                <div style="display: flex; gap: 5px; margin-left: 15px;">
                  <button class="btn btn-sm btn-success" onclick="markAsLearned('${filePath}', '${item.id}')">✓ 学会</button>
                  <button class="btn btn-sm btn-warning" onclick="markAsForgotten('${filePath}', '${item.id}')">✗ 忘记</button>
                  <button class="btn btn-sm btn-info" onclick="editKnowledgeItem('${filePath}', '${item.id}')">编辑</button>
                  <button class="btn btn-sm btn-danger" onclick="deleteKnowledgeItem('${filePath}', '${item.id}')">删除</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `);
}

function addKnowledgeItem(filePath) {
  hideModal();
  setTimeout(() => {
    showModal(`
      <h2 style="margin-bottom: 20px; font-size: 24px;">添加知识点</h2>
      <form onsubmit="submitKnowledgeItem(event, '${filePath}')">
        <div class="form-group">
          <label class="form-label">知识名 *</label>
          <input type="text" name="name" class="form-input" required>
        </div>
        <div class="form-group">
          <label class="form-label">知识概括</label>
          <textarea name="brief" class="form-textarea" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">详细内容</label>
          <textarea name="detail" class="form-textarea" rows="4"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">相关URL</label>
          <input type="url" name="url" class="form-input">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">确定添加</button>
      </form>
    `);
  }, 100);
}

function editKnowledgeItem(filePath, itemId) {
  hideModal();
  setTimeout(async () => {
    try {
      const items = await apiCall(`/api/knowledge/items?filePath=${encodeURIComponent(filePath)}`);
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        alert('知识项不存在');
        return;
      }
      
      showModal(`
        <h2 style="margin-bottom: 20px; font-size: 24px;">编辑知识点</h2>
        <form onsubmit="submitEditKnowledgeItem(event, '${filePath}', '${itemId}')">
          <div class="form-group">
            <label class="form-label">知识名 *</label>
            <input type="text" name="name" class="form-input" value="${item.name}" required>
          </div>
          <div class="form-group">
            <label class="form-label">知识概括</label>
            <textarea name="brief" class="form-textarea" rows="2">${item.brief || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">详细内容</label>
            <textarea name="detail" class="form-textarea" rows="4">${item.detail || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">相关URL</label>
            <input type="url" name="url" class="form-input" value="${item.url || ''}">
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">保存修改</button>
        </form>
      `);
    } catch (error) {
      console.error('加载知识项失败:', error);
    }
  }, 100);
}

async function submitKnowledgeItem(e, filePath) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const item = {
    name: formData.get('name'),
    brief: formData.get('brief'),
    detail: formData.get('detail'),
    url: formData.get('url'),
    learnCount: 0,
    forgetCount: 0
  };
  
  await apiCall('/api/knowledge/item', {
    method: 'POST',
    body: JSON.stringify({ filePath, item })
  });
  
  hideModal();
  viewKnowledgeFile(filePath, filePath.split('/').pop().replace('.json', ''));
}

async function submitEditKnowledgeItem(e, filePath, itemId) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const item = {
    id: itemId,
    name: formData.get('name'),
    brief: formData.get('brief'),
    detail: formData.get('detail'),
    url: formData.get('url')
  };
  
  await apiCall('/api/knowledge/item', {
    method: 'POST',
    body: JSON.stringify({ filePath, item })
  });
  
  hideModal();
  viewKnowledgeFile(filePath, filePath.split('/').pop().replace('.json', ''));
}

async function deleteKnowledgeItem(filePath, itemId) {
  if (!confirm('确定要删除这个知识点吗？')) return;
  
  await apiCall('/api/knowledge/item', {
    method: 'DELETE',
    body: JSON.stringify({ filePath, itemId })
  });
  
  hideModal();
  viewKnowledgeFile(filePath, filePath.split('/').pop().replace('.json', ''));
}

async function markAsLearned(filePath, itemId) {
  await apiCall('/api/knowledge/item/learn', {
    method: 'POST',
    body: JSON.stringify({
      filePath,
      itemId,
      learners: AppState.knowledgeConfig.currentLearners,
      targetAttributes: AppState.knowledgeConfig.targetAttributes
    })
  });
  
  hideModal();
  viewKnowledgeFile(filePath, filePath.split('/').pop().replace('.json', ''));
}

async function markAsForgotten(filePath, itemId) {
  await apiCall('/api/knowledge/item/forget', {
    method: 'POST',
    body: JSON.stringify({ filePath, itemId })
  });
  
  hideModal();
  viewKnowledgeFile(filePath, filePath.split('/').pop().replace('.json', ''));
}

function addRootCategory() {
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">添加知识大分类</h2>
    <form onsubmit="submitRootCategory(event)">
      <div class="form-group">
        <label class="form-label">分类名称 *</label>
        <input type="text" name="name" class="form-input" required placeholder="如：数学、语文、英语">
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">确定添加</button>
    </form>
  `);
}

async function submitRootCategory(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const name = formData.get('name');
  
  await apiCall('/api/knowledge/category', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
  
  hideModal();
  renderKnowledgePage();
}

async function deleteRootCategory(name) {
  if (!confirm(`确定要删除"${name}"分类吗？这将删除其下所有内容。`)) return;
  
  await apiCall('/api/knowledge/category', {
    method: 'DELETE',
    body: JSON.stringify({ categoryPath: name })
  });
  
  renderKnowledgePage();
}

function enterCategory(name, category) {
  AppState.currentKnowledgePath = name;
  renderKnowledgeItems();
}

function navigateToPath(path) {
  AppState.currentKnowledgePath = path;
  if (path) {
    renderKnowledgeItems();
  } else {
    renderKnowledgeStructure();
  }
}

function addSubCategory() {
  showModal(`
    <h2 style="margin-bottom: 20px; font-size: 24px;">添加子分类</h2>
    <form onsubmit="submitSubCategory(event)">
      <div class="form-group">
        <label class="form-label">类型 *</label>
        <select name="isFile" class="form-select" required>
          <option value="false">子目录（可继续包含子分类）</option>
          <option value="true">知识文件（可添加知识点）</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">名称 *</label>
        <input type="text" name="name" class="form-input" required>
      </div>
      <button type="submit" class="btn btn-primary" style="width: 100%;">确定添加</button>
    </form>
  `);
}

async function submitSubCategory(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const name = formData.get('name');
  const isFile = formData.get('isFile') === 'true';
  
  await apiCall('/api/knowledge/subcategory', {
    method: 'POST',
    body: JSON.stringify({
      parentPath: AppState.currentKnowledgePath,
      name,
      isFile
    })
  });
  
  hideModal();
  await loadKnowledgeData();
  renderKnowledgeItems();
}

async function updateKnowledgeConfig() {
  const learnersSelect = document.getElementById('currentLearnersSelect');
  const attributesSelect = document.getElementById('targetAttributesSelect');
  
  const selectedLearners = Array.from(learnersSelect.selectedOptions).map(opt => opt.value);
  const selectedAttributes = Array.from(attributesSelect.selectedOptions).map(opt => opt.value);
  
  const targetAttributes = {};
  selectedAttributes.forEach(attrId => {
    targetAttributes[attrId] = true;
  });
  
  AppState.knowledgeConfig = {
    currentLearners: selectedLearners,
    targetAttributes
  };
  
  await apiCall('/api/knowledge/config', {
    method: 'PUT',
    body: JSON.stringify(AppState.knowledgeConfig)
  });
}

function showKnowledgeSubPage(page) {
  AppState.knowledgeSubPage = page;
  renderKnowledgePage();
}

// 自由学习模式
function renderFreeLearning() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  subNav.innerHTML = `
    <button class="sub-nav-btn" onclick="showKnowledgeSubPage('categories')" style="background: #667eea; color: white;">← 返回知识库</button>
    <div style="flex: 1;"></div>
    <div style="font-size: 16px; color: #666;">
      学习人: ${AppState.knowledgeConfig.currentLearners.map(id => {
        const member = AppState.members.find(m => m.id === id);
        return member ? member.name : '';
      }).filter(n => n).join(', ') || '未选择'}
    </div>
  `;
  
  if (AppState.freeLearnItems.length === 0) {
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🎯 自由学习</h2>
        </div>
        <div style="padding: 30px;">
          <p style="margin-bottom: 20px; font-size: 18px;">请选择学习范围：</p>
          ${renderFreeLearningCategories(AppState.knowledgeStructure)}
        </div>
      </div>
    `;
  } else {
    renderFreeLearningItem();
  }
}

function renderFreeLearningCategories(categories, level = 0) {
  return categories.map(cat => `
    <div style="margin-left: ${level * 20}px; margin-bottom: 10px;">
      ${cat.type === 'file' ? `
        <button class="btn btn-primary" onclick="startFreeLearning('${cat.path}')" style="margin-bottom: 5px;">
          📄 ${cat.name} (${cat.knowledgeItems.length}个知识点)
        </button>
      ` : `
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">📁 ${cat.name}</div>
        ${cat.children ? renderFreeLearningCategories(cat.children, level + 1) : ''}
      `}
    </div>
  `).join('');
}

async function startFreeLearning(filePath) {
  try {
    const items = await apiCall(`/api/knowledge/items?filePath=${encodeURIComponent(filePath)}`);
    
    if (items.length === 0) {
      alert('该分类下没有知识点');
      return;
    }
    
    // 随机打乱顺序
    AppState.freeLearnItems = items.sort(() => Math.random() - 0.5);
    AppState.freeLearnIndex = 0;
    AppState.freeLearnShowDetail = false;
    AppState.freeLearnFilePath = filePath;
    
    renderFreeLearningItem();
  } catch (error) {
    console.error('加载知识点失败:', error);
  }
}

function renderFreeLearningItem() {
  const contentArea = document.getElementById('contentArea');
  const item = AppState.freeLearnItems[AppState.freeLearnIndex];
  
  if (!item) {
    contentArea.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">🎉 学习完成！</h2>
        </div>
        <div style="padding: 50px; text-align: center;">
          <p style="font-size: 24px; margin-bottom: 30px;">所有知识点已学习完毕</p>
          <button class="btn btn-primary" onclick="exitFreeLearning()">返回</button>
        </div>
      </div>
    `;
    return;
  }
  
  const progress = `${AppState.freeLearnIndex + 1} / ${AppState.freeLearnItems.length}`;
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <button class="btn btn-sm" onclick="exitFreeLearning()">← 返回</button>
          <span style="margin-left: 15px; font-size: 18px;">进度: ${progress}</span>
        </div>
      </div>
      <div style="padding: 50px; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
        ${!AppState.freeLearnShowDetail ? `
          <div style="font-size: ${item.brief ? '72px' : '48px'}; font-weight: bold; text-align: center; margin-bottom: 40px;">
            ${item.brief || item.name}
          </div>
          <button class="btn btn-primary" onclick="showFreeLearningDetail()" style="font-size: 20px; padding: 15px 40px;">
            查看详情
          </button>
        ` : `
          ${item.brief && item.brief !== item.name ? `
            <div style="font-size: 72px; font-weight: bold; text-align: center; margin-bottom: 30px;">
              ${item.brief}
            </div>
          ` : ''}
          <div style="font-size: 32px; font-weight: bold; margin-bottom: 20px;">
            ${item.name}
          </div>
          ${item.detail ? `
            <div style="font-size: 20px; color: #666; margin-bottom: 20px; text-align: center; max-width: 800px;">
              ${item.detail}
            </div>
          ` : ''}
          ${item.url ? `
            <div style="margin-bottom: 20px;">
              <a href="${item.url}" target="_blank" style="font-size: 18px;">查看链接 →</a>
            </div>
          ` : ''}
          <div style="display: flex; gap: 20px; margin-top: 40px;">
            <button class="btn btn-success" onclick="freeLearningMarkLearned()" style="font-size: 18px; padding: 12px 30px;">
              ✓ 学会了
            </button>
            <button class="btn btn-warning" onclick="freeLearningMarkForgotten()" style="font-size: 18px; padding: 12px 30px;">
              ✗ 忘记了
            </button>
          </div>
          <div style="display: flex; gap: 15px; margin-top: 30px;">
            ${AppState.freeLearnIndex > 0 ? `
              <button class="btn btn-info" onclick="freeLearningPrev()" style="font-size: 16px;">
                ← 上一个
              </button>
            ` : ''}
            <button class="btn btn-info" onclick="freeLearningNext()" style="font-size: 16px;">
              下一个 →
            </button>
          </div>
        `}
      </div>
    </div>
  `;
}

function showFreeLearningDetail() {
  AppState.freeLearnShowDetail = true;
  renderFreeLearningItem();
}

async function freeLearningMarkLearned() {
  const item = AppState.freeLearnItems[AppState.freeLearnIndex];
  await apiCall('/api/knowledge/item/learn', {
    method: 'POST',
    body: JSON.stringify({
      filePath: AppState.freeLearnFilePath,
      itemId: item.id,
      learners: AppState.knowledgeConfig.currentLearners,
      targetAttributes: AppState.knowledgeConfig.targetAttributes
    })
  });
  
  freeLearningNext();
}

async function freeLearningMarkForgotten() {
  const item = AppState.freeLearnItems[AppState.freeLearnIndex];
  await apiCall('/api/knowledge/item/forget', {
    method: 'POST',
    body: JSON.stringify({
      filePath: AppState.freeLearnFilePath,
      itemId: item.id
    })
  });
  
  freeLearningNext();
}

function freeLearningNext() {
  AppState.freeLearnIndex++;
  AppState.freeLearnShowDetail = false;
  renderFreeLearningItem();
}

function freeLearningPrev() {
  if (AppState.freeLearnIndex > 0) {
    AppState.freeLearnIndex--;
    AppState.freeLearnShowDetail = false;
    renderFreeLearningItem();
  }
}

function exitFreeLearning() {
  AppState.freeLearnItems = [];
  AppState.freeLearnIndex = 0;
  AppState.freeLearnShowDetail = false;
  AppState.freeLearnFilePath = null;
  renderFreeLearning();
}

// 知识导入
function renderKnowledgeImport() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  subNav.innerHTML = `
    <button class="sub-nav-btn" onclick="showKnowledgeSubPage('categories')" style="background: #667eea; color: white;">← 返回知识库</button>
  `;
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">📥 知识录入</h2>
      </div>
      <div style="padding: 30px;">
        <p style="margin-bottom: 20px; font-size: 18px;">请粘贴JSON格式的知识数据：</p>
        <p style="margin-bottom: 15px; color: #666; font-size: 16px;">
          格式示例：<br>
          [{"levelRootName": "英语", "level1Name": "单词", "level2Name": "水果", "name": "apple", "brief": "apple", "detail": "苹果", "url": ""}]
        </p>
        <form onsubmit="submitKnowledgeImport(event)">
          <div class="form-group">
            <textarea id="importJsonData" class="form-textarea" rows="15" placeholder='[{"levelRootName": "...", ...}]' required></textarea>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">开始导入</button>
        </form>
      </div>
    </div>
  `;
}

async function submitKnowledgeImport(e) {
  e.preventDefault();
  
  const jsonData = document.getElementById('importJsonData').value;
  
  try {
    const data = JSON.parse(jsonData);
    
    if (!Array.isArray(data)) {
      alert('JSON数据必须是数组格式');
      return;
    }
    
    const result = await apiCall('/api/knowledge/import', {
      method: 'POST',
      body: JSON.stringify({ data })
    });
    
    alert(`成功导入 ${result.imported} 个知识点！`);
    showKnowledgeSubPage('categories');
  } catch (error) {
    console.error('导入失败:', error);
    alert('导入失败，请检查JSON格式是否正确');
  }
}

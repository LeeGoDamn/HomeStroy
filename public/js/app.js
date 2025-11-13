// 全局状态
const AppState = {
  currentPage: 'members',
  members: [],
  attributeDefinitions: [],
  memberAttributes: {},
  todos: [],
  periodicTasks: []
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
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const page = item.dataset.page;
      AppState.currentPage = page;
      renderPage(page);
    });
  });
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
    case 'attributes':
      renderAttributesPage();
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
    <button class="sub-nav-btn primary" onclick="addMember()">➕ 添加成员</button>
  `;
  
  AppState.members = await apiCall('/api/members');
  
  if (AppState.members.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">👥</div>
        <div class="empty-state-text">还没有家庭成员，点击上方按钮添加吧</div>
      </div>
    `;
    return;
  }
  
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

// ========== 家庭成员属性页面 ==========
async function renderAttributesPage() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  subNav.innerHTML = `
    <button class="sub-nav-btn primary" onclick="addAttributeDefinition()">➕ 添加属性类型</button>
  `;
  
  AppState.members = await apiCall('/api/members');
  AppState.attributeDefinitions = await apiCall('/api/attribute-definitions');
  AppState.memberAttributes = await apiCall('/api/member-attributes');
  
  if (AppState.members.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-text">请先添加家庭成员</div>
      </div>
    `;
    return;
  }
  
  if (AppState.attributeDefinitions.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📊</div>
        <div class="empty-state-text">还没有属性类型，点击上方按钮添加吧</div>
      </div>
    `;
    return;
  }
  
  contentArea.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">成员属性管理</h2>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>成员</th>
              ${AppState.attributeDefinitions.map(def => `
                <th>
                  ${def.name} (${def.type === 'integer' ? '整数' : '字符串'})
                  <button class="btn btn-sm btn-danger" onclick="deleteAttributeDefinition('${def.id}')" style="margin-left: 8px;">删除</button>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${AppState.members.map(member => `
              <tr>
                <td><strong>${member.name}</strong></td>
                ${AppState.attributeDefinitions.map(def => {
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
  renderAttributesPage();
}

async function deleteAttributeDefinition(id) {
  if (!confirm('确定要删除这个属性类型吗？这将删除所有成员的该属性值。')) return;
  
  await apiCall(`/api/attribute-definitions/${id}`, {
    method: 'DELETE'
  });
  
  renderAttributesPage();
}

async function adjustAttribute(memberId, attrId, delta) {
  const currentValue = AppState.memberAttributes[memberId]?.[attrId] || 0;
  const newValue = parseInt(currentValue) + delta;
  
  await apiCall(`/api/member-attributes/${memberId}/${attrId}`, {
    method: 'PUT',
    body: JSON.stringify({ value: newValue })
  });
  
  renderAttributesPage();
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
    status: formData.get('status')
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
    status: formData.get('status')
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
    maxGenerations: formData.get('maxGenerations') ? parseInt(formData.get('maxGenerations')) : null
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
    maxGenerations: formData.get('maxGenerations') ? parseInt(formData.get('maxGenerations')) : null
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
function renderKnowledgePage() {
  const subNav = document.getElementById('subNav');
  const contentArea = document.getElementById('contentArea');
  
  subNav.innerHTML = '';
  
  contentArea.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📚</div>
      <div class="empty-state-text">知识库功能开发中，敬请期待...</div>
    </div>
  `;
}

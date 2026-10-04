const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let tasks = [
  { id: uuidv4(), title: 'Bem-vindo ao TaskFlow!', description: 'Este é seu primeiro task.', status: 'done', priority: 'low', createdAt: new Date().toISOString() },
  { id: uuidv4(), title: 'Explorar a API', description: 'Teste GET /tasks e POST /tasks', status: 'todo', priority: 'high', createdAt: new Date().toISOString() },
  { id: uuidv4(), title: 'Deploy no Render', description: 'Suba esse projeto!', status: 'progress', priority: 'medium', createdAt: new Date().toISOString() },
];

const validateTask = (req, res, next) => {
  const { title, status, priority } = req.body;
  if (!title || typeof title !== 'string' || title.trim().length === 0)
    return res.status(400).json({ error: 'Campo "title" é obrigatório.' });
  if (status && !['todo', 'progress', 'done'].includes(status))
    return res.status(400).json({ error: 'status inválido.' });
  if (priority && !['low', 'medium', 'high'].includes(priority))
    return res.status(400).json({ error: 'priority inválido.' });
  next();
};

app.get('/api/health', (req, res) => res.json({ status: 'ok', tasks: tasks.length }));
app.get('/api/stats', (req, res) => {
  res.json({ total: tasks.length, done: tasks.filter(t => t.status === 'done').length, progress: tasks.filter(t => t.status === 'progress').length, todo: tasks.filter(t => t.status === 'todo').length });
});
app.get('/api/tasks', (req, res) => {
  let list = [...tasks];
  if (req.query.status) list = list.filter(t => t.status === req.query.status);
  if (req.query.priority) list = list.filter(t => t.priority === req.query.priority);
  if (req.query.search) { const q = req.query.search.toLowerCase(); list = list.filter(t => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))); }
  if (req.query.sort === 'newest') list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (req.query.sort === 'priority') { const order = { high: 0, medium: 1, low: 2 }; list.sort((a, b) => order[a.priority] - order[b.priority]); }
  res.json(list);
});
app.get('/api/tasks/:id', (req, res) => { const task = tasks.find(t => t.id === req.params.id); task ? res.json(task) : res.status(404).json({ error: 'Task não encontrada.' }); });
app.post('/api/tasks', validateTask, (req, res) => { const { title, description = '', status = 'todo', priority = 'medium' } = req.body; const task = { id: uuidv4(), title: title.trim(), description: description.trim(), status, priority, createdAt: new Date().toISOString() }; tasks.unshift(task); res.status(201).json(task); });
app.put('/api/tasks/:id', validateTask, (req, res) => { const idx = tasks.findIndex(t => t.id === req.params.id); if (idx === -1) return res.status(404).json({ error: 'Task não encontrada.' }); const { title, description, status, priority } = req.body; tasks[idx] = { ...tasks[idx], title: title?.trim() ?? tasks[idx].title, description: description?.trim() ?? tasks[idx].description, status: status ?? tasks[idx].status, priority: priority ?? tasks[idx].priority }; res.json(tasks[idx]); });
app.delete('/api/tasks/:id', (req, res) => { const idx = tasks.findIndex(t => t.id === req.params.id); if (idx === -1) return res.status(404).json({ error: 'Task não encontrada.' }); res.json({ message: 'Task removida.', task: tasks.splice(idx, 1)[0] }); });
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.listen(PORT, () => console.log(`🚀 TaskFlow rodando na porta ${PORT}`));

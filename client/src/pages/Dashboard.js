import React, { useEffect, useState } from 'react';
import { authGet, authPost, authPut, authDelete } from '../services/api';

export default function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title:'', description:'', dueDate:'' });
  const [filter, setFilter] = useState('all');

  async function load() {
    const res = await authGet('/tasks');
    if (res.success) setTasks(res.tasks || []);
  }

  useEffect(()=>{ load(); }, []);

  async function create(e) {
    e.preventDefault();
    const payload = { ...form, userId: user.id };
    await authPost('/tasks', payload);
    setForm({ title:'', description:'', dueDate:'' });
    load();
  }

  async function updateStatus(id, progress) {
    await authPut(`/tasks/${id}`, { progress });
    load();
  }

  async function remove(id) {
    await authDelete(`/tasks/${id}`);
    load();
  }

  const visible = tasks.filter(t => filter==='all' ? true : t.progress===filter);

  return (
    <div>
      <h2>Dashboard ({user.role})</h2>
      <div>
        <button onClick={() => { localStorage.clear(); onLogout(); }}>Logout</button>
      </div>

      <form onSubmit={create}>
        <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="title" required />
        <input value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})} type="date" />
        <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="desc" />
        <button>Create</button>
      </form>

      <div>
        <label>Filter: </label>
        <select onChange={e=>setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="not-started">Not started</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <ul>
        {visible.map(t => (
          <li key={t._id} style={{border:'1px solid #ccc', margin:'8px', padding:'8px'}}>
            <b>{t.title}</b> ({t.progress}) {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ''}
            <div>{t.description}</div>
            <div>
              <select value={t.progress} onChange={e=>updateStatus(t._id, e.target.value)}>
                <option value="not-started">not-started</option>
                <option value="in-progress">in-progress</option>
                <option value="completed">completed</option>
              </select>
              {String(t.userId) === String(user.id) && <button onClick={()=>remove(t._id)} style={{marginLeft:8}}>Delete</button>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

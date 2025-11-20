import React, { useState } from 'react';
import { post } from '../services/api';

export default function Signup() {
  const [form, setForm] = useState({ email:'', password:'', role:'student', teacherId:'' });
  const [msg, setMsg] = useState('');
  async function submit(e) {
    e.preventDefault();
    const res = await post('/auth/signup', form);
    setMsg(res.message || JSON.stringify(res));
  }
  return (
    <form onSubmit={submit}>
      <h2>Signup</h2>
      <input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email" />
      <input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} placeholder="password" />
      <select value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
      </select>
      {form.role==='student' && <input value={form.teacherId} onChange={e=>setForm({...form,teacherId:e.target.value})} placeholder="teacherId" />}
      <button>Signup</button>
      <div>{msg}</div>
    </form>
  );
}

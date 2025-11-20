const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:4000';

function getToken() { return localStorage.getItem('token'); }
function authHeaders() { 
  const token = getToken();
  return token ? { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` } : { 'Content-Type':'application/json' };
}

export async function post(path, body) {
  const res = await fetch(API_BASE + path, { method:'POST', headers:{ 'Content-Type':'application/json'}, body: JSON.stringify(body) });
  return res.json();
}

export async function authGet(path) {
  const res = await fetch(API_BASE + path, { headers: authHeaders() });
  return res.json();
}

export async function authPost(path, body) {
  const res = await fetch(API_BASE + path, { method:'POST', headers: authHeaders(), body: JSON.stringify(body) });
  return res.json();
}

export async function authPut(path, body) {
  const res = await fetch(API_BASE + path, { method:'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  return res.json();
}

export async function authDelete(path) {
  const res = await fetch(API_BASE + path, { method:'DELETE', headers: authHeaders() });
  return res.json();
}

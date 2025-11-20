import React, { useState } from 'react';
import Login from '../../client/src/pages/Login';
import Signup from '../../client/src/pages/Signup';
import Dashboard from '../../client/src/pages/Dashboard';

function App() {
  const stored = localStorage.getItem('user');
  const [user, setUser] = useState(stored ? JSON.parse(stored) : null);
  if (!user) {
    return (
      <div style={{display:'flex',gap:40, padding:20}}>
        <div style={{flex:1}}><Login onLogin={u=>setUser(u)} /></div>
        <div style={{flex:1}}><Signup /></div>
      </div>
    );
  }
  return <Dashboard user={user} onLogout={()=>{ localStorage.removeItem('user'); localStorage.removeItem('token'); setUser(null); }} />;
}

export default App;

import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [tasks, setTasks] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [view, setView] = useState('LIST');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newTask, setNewTask] = useState({
    title: '', description: '', dateTime: '', priority: 'Medium', assignedUser: ''
  });

  const getRoleFromToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      return payload.role || '';
    } catch (e) {
      return '';
    }
  };

  useEffect(() => {
    if (token) {
      // 1. Fetch Tasks & Bridge Naming Gaps
      fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setTasks(data.map(t => {
          // Gap Fix: Check for dateTime, createdDate (Java), and created_date (SQL)
          const rawDate = t.dateTime || t.createdDate || t.created_date;
          return {
            ...t,
            dateTime: rawDate ? rawDate.toString().replace(' ', 'T') : null
          };
        }));
      })
      .catch(err => console.error("Task Fetch Error:", err));

      // 2. Fetch User List for Dropdown
      fetch(`${API_URL}/auth/users`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setAllUsers(data))
      .catch(err => console.error("User List Error:", err));
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (res.ok) {
      const data = await res.json();
      const role = getRoleFromToken(data.token);
      setToken(data.token);
      setUserRole(role);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
    } else {
      alert("Login failed");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(newTask)
    });

    if (res.ok) {
      alert("Task Created!");
      setView('LIST');
      fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setTasks(d.map(t => ({
          ...t,
          dateTime: (t.dateTime || t.createdDate || t.created_date)?.toString().replace(' ', 'T')
        }))));
    }
  };

  // Gap Fix: Map 'APPROVED' to '/approve' and 'REJECTED' to '/reject'
  const updateStatus = async (id, newStatus) => {
      const endpoint = newStatus === 'APPROVED' ? 'approve' : 'reject';

      const res = await fetch(`${API_URL}/tasks/${id}/${endpoint}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
      } else if (res.status === 403) {
        alert("Only Managers can perform this action.");
      } else if (res.status === 404) {
        alert("Endpoint not found. Check if backend uses /approve or /approved.");
      }
  };

  const getProcessedTasks = () => {
    let filtered = tasks.filter(t => statusFilter === 'ALL' || t.status === statusFilter);
    return filtered.sort((a, b) => {
      if (sortBy === 'priority') {
        const order = { 'High': 3, 'Medium': 2, 'Low': 1 };
        return order[b.priority] - order[a.priority];
      }
      return new Date(b.dateTime) - new Date(a.dateTime);
    });
  };

  if (!token) {
    return (
      <div style={styles.loginBox}>
        <h2>Task App Login</h2>
        <form onSubmit={handleLogin}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} />
          <button type="submit" style={styles.primaryBtn}>Login</button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.layout}>
      <header style={styles.header}>
        <div style={styles.brand}>Task App</div>
        <nav style={styles.nav}>
          <button onClick={() => setView('LIST')} style={{...styles.navBtn, borderBottom: view === 'LIST' ? '2px solid white' : 'none'}}>List View</button>
          <button onClick={() => setView('CREATE')} style={{...styles.navBtn, borderBottom: view === 'CREATE' ? '2px solid white' : 'none'}}>Create Task</button>
          {(userRole === 'MANAGER' || userRole === 'ROLE_MANAGER') && (
            <button onClick={() => setView('DASHBOARD')} style={{...styles.navBtn, borderBottom: view === 'DASHBOARD' ? '2px solid white' : 'none'}}>Dashboard</button>
          )}
        </nav>
        <div style={{display:'flex', alignItems:'center'}}>
          <span style={styles.roleTag}>{userRole}</span>
          <button onClick={() => { setToken(''); localStorage.clear(); }} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {view === 'CREATE' ? (
          <section style={styles.card}>
            <h3>Create New Task</h3>
            <form onSubmit={handleCreateTask} style={styles.form}>
              <input required type="text" placeholder="Title" onChange={e => setNewTask({...newTask, title: e.target.value})} style={styles.input} />
              <textarea placeholder="Description" onChange={e => setNewTask({...newTask, description: e.target.value})} style={styles.input} />
              <label>Date/Time:</label>
              <input required type="datetime-local" onChange={e => setNewTask({...newTask, dateTime: e.target.value})} style={styles.input} />
              <select onChange={e => setNewTask({...newTask, priority: e.target.value})} style={styles.input}>
                <option value="Low">Low Priority</option><option value="Medium">Medium Priority</option><option value="High">High Priority</option>
              </select>

              <label>Assign To User:</label>
              <select required style={styles.input} value={newTask.assignedUser} onChange={e => setNewTask({...newTask, assignedUser: e.target.value})}>
                <option value="">-- Select User --</option>
                {allUsers && allUsers.map(u => (
                  <option key={u.id} value={u.username}>{u.username} ({u.role})</option>
                ))}
              </select>
              <button type="submit" style={styles.primaryBtn}>Save Task</button>
            </form>
          </section>
        ) : view === 'DASHBOARD' ? (
          <section>
            <h3>Manager Management Dashboard</h3>
            <div style={styles.dashboardGrid}>
              <div style={styles.dashboardCol}>
                <h4>Pending Tasks</h4>
                {tasks.filter(t => t.status === 'PENDING').map(t => (
                  <div key={t.id} style={styles.miniCard}>
                    <div><strong>{t.title}</strong><br/><small>User: {t.assignedUser}</small></div>
                    <div>
                      <button onClick={() => updateStatus(t.id, 'APPROVED')} style={styles.approveBtn}>Approve</button>
                      <button onClick={() => updateStatus(t.id, 'REJECTED')} style={styles.rejectBtn}>Reject</button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={styles.dashboardCol}>
                <h4>History</h4>
                {tasks.filter(t => t.status !== 'PENDING').map(t => (
                  <div key={t.id} style={styles.miniCard}>
                    <span>{t.title}</span> <span style={{color: t.status === 'APPROVED' ? 'green' : 'red'}}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div style={styles.listHeader}>
              <h3>Task Overview</h3>
              <div style={{display: 'flex', gap: '10px'}}>
                <select onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
                  <option value="ALL">All Status</option><option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
                </select>
                <select onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
                  <option value="date">Sort by Date</option><option value="priority">Sort by Priority</option>
                </select>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr><th>Title</th><th>Date</th><th>Assigned</th><th>Priority</th><th>Status</th></tr>
              </thead>
              <tbody>
                {getProcessedTasks().map(task => (
                  <tr key={task.id} style={styles.row}>
                    <td>{task.title}</td>
                    <td>{task.dateTime && !isNaN(new Date(task.dateTime)) ? new Date(task.dateTime).toLocaleString() : 'No Date'}</td>
                    <td>{task.assignedUser}</td>
                    <td>{task.priority || 'Medium'}</td>
                    <td><span style={{color: task.status === 'APPROVED' ? 'green' : task.status === 'REJECTED' ? 'red' : 'orange'}}>{task.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
      <footer style={styles.footer}>© 2026 Task App | copyright rishi</footer>
    </div>
  );
}

const styles = {
  layout: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial', backgroundColor: '#f4f7f6' },
  header: { background: '#003087', color: 'white', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  brand: { fontSize: '1.5rem', fontWeight: 'bold' },
  nav: { display: 'flex', gap: '20px' },
  navBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', paddingBottom: '5px' },
  main: { flex: 1, padding: '30px', maxWidth: '1100px', margin: 'auto', width: '100%' },
  card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
  input: { display: 'block', width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '6px', border: '1px solid #ddd' },
  primaryBtn: { background: '#0070ba', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  approveBtn: { background: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' },
  rejectBtn: { background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' },
  footer: { textAlign: 'center', padding: '20px', background: '#ffffff', borderTop: '1px solid #eee', color: '#666' },
  table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden' },
  row: { borderBottom: '1px solid #eee', textAlign: 'left', padding: '15px' },
  roleTag: { background: '#ffc107', color: 'black', padding: '4px 10px', borderRadius: '20px', marginRight: '15px', fontSize: '0.8rem', fontWeight: 'bold' },
  logoutBtn: { background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '5px 12px', borderRadius: '4px' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  dashboardCol: { background: '#fff', padding: '20px', borderRadius: '10px' },
  miniCard: { padding: '15px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  form: { display: 'flex', flexDirection: 'column' },
  select: { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' },
  loginBox: { maxWidth: '400px', margin: '100px auto', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
};

export default App;

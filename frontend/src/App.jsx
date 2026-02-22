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

  // NEW: State to track if the backend is fully booted
  const [isBackendReady, setIsBackendReady] = useState(false);

  // NEW: Polling mechanism to check backend health
  useEffect(() => {
    if (token) return; // Don't poll if already logged in

    const checkBackendHealth = async () => {
      try {
        // Send a lightweight OPTIONS request to see if the Gateway and Identity Service are talking
        const res = await fetch(`${API_URL}/auth/login`, { method: 'OPTIONS' });

        // If it's not a 500 error, the backend is up and routing properly!
        if (res.status !== 500) {
          setIsBackendReady(true);
        } else {
          setTimeout(checkBackendHealth, 3000); // Try again in 3 seconds
        }
      } catch (err) {
        // Network error means the Gateway itself isn't up yet
        setTimeout(checkBackendHealth, 3000);
      }
    };

    checkBackendHealth();
  }, [token]);

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
      fetch(`${API_URL}/tasks`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        setTasks(data.map(t => {
          const rawDate = t.dateTime || t.createdDate || t.created_date;
          return {
            ...t,
            dateTime: rawDate ? rawDate.toString().replace(' ', 'T') : null
          };
        }));
      })
      .catch(err => console.error("Task Fetch Error:", err));

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
      setView('LIST');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', role);
    } else {
      alert("Login failed. Please check your credentials.");
    }
  };

  // ... (Keep your existing handleCreateTask, updateStatus, and getProcessedTasks functions exactly the same) ...
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
        <form onSubmit={handleLogin} style={styles.form}>
          <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} style={styles.input} disabled={!isBackendReady} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={styles.input} disabled={!isBackendReady} />

          {/* NEW: Conditional rendering for the login button based on backend health */}
          {isBackendReady ? (
            <button type="submit" style={styles.primaryBtn}>Login</button>
          ) : (
            <button type="button" style={{...styles.primaryBtn, background: '#ccc', cursor: 'not-allowed'}} disabled>
              Warming up backend... Please wait ⏳
            </button>
          )}
        </form>
      </div>
    );
  }

  // ... (Keep the rest of your UI return block and styles object exactly the same) ...
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
        <div style={styles.userControls}>
          <span style={styles.roleTag}>{userRole}</span>
          <button onClick={() => {
            setToken('');
            setUserRole('');
            setView('LIST');
            localStorage.clear();
          }} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <main style={styles.main}>
        {view === 'CREATE' ? (
          <section style={styles.card}>
            <h3>Create New Task</h3>
            <form onSubmit={handleCreateTask} style={styles.form}>
              <input required type="text" placeholder="Title" onChange={e => setNewTask({...newTask, title: e.target.value})} style={styles.input} />
              <textarea placeholder="Description" onChange={e => setNewTask({...newTask, description: e.target.value})} style={styles.input} />
              <label style={styles.label}>Date/Time:</label>
              <input required type="datetime-local" onChange={e => setNewTask({...newTask, dateTime: e.target.value})} style={styles.input} />
              <label style={styles.label}>Priority:</label>
              <select onChange={e => setNewTask({...newTask, priority: e.target.value})} style={styles.input}>
                <option value="Low">Low Priority</option><option value="Medium">Medium Priority</option><option value="High">High Priority</option>
              </select>

              <label style={styles.label}>Assign To User:</label>
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
                    <div style={styles.actionButtons}>
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
                    <span>{t.title}</span> <span style={{color: t.status === 'APPROVED' ? 'green' : 'red', fontWeight: 'bold'}}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section>
            <div style={styles.listHeader}>
              <h3>Task Overview</h3>
              <div style={styles.filterControls}>
                <select onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
                  <option value="ALL">All Status</option><option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option>
                </select>
                <select onChange={(e) => setSortBy(e.target.value)} style={styles.select}>
                  <option value="date">Sort by Date</option><option value="priority">Sort by Priority</option>
                </select>
              </div>
            </div>

            <div style={styles.tableContainer}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Title</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Assigned</th>
                    <th style={styles.th}>Priority</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getProcessedTasks().map(task => (
                    <tr key={task.id} style={styles.row}>
                      <td style={styles.td}>{task.title}</td>
                      <td style={styles.td}>{task.dateTime && !isNaN(new Date(task.dateTime)) ? new Date(task.dateTime).toLocaleString() : 'No Date'}</td>
                      <td style={styles.td}>{task.assignedUser}</td>
                      <td style={styles.td}>{task.priority || 'Medium'}</td>
                      <td style={styles.td}><span style={{color: task.status === 'APPROVED' ? 'green' : task.status === 'REJECTED' ? 'red' : 'orange', fontWeight: 'bold'}}>{task.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
      <footer style={styles.footer}>© 2026 Task App | copyright rishi</footer>
    </div>
  );
}

const styles = {
  layout: { minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6' },
  header: { background: '#003087', color: 'white', padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  brand: { fontSize: '1.5rem', fontWeight: 'bold' },
  nav: { display: 'flex', gap: '15px', flexWrap: 'wrap' },
  navBtn: { background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem', paddingBottom: '5px' },
  userControls: { display: 'flex', alignItems: 'center', gap: '10px' },
  main: { flex: 1, padding: '30px 5%', width: '100%', boxSizing: 'border-box' },
  card: { background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' },
  form: { display: 'flex', flexDirection: 'column', width: '100%' },
  label: { marginBottom: '5px', fontWeight: 'bold', color: '#333' },
  input: { display: 'block', width: '100%', marginBottom: '20px', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' },
  primaryBtn: { background: '#0070ba', color: 'white', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
  dashboardCol: { background: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  miniCard: { padding: '15px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' },
  actionButtons: { display: 'flex', gap: '5px' },
  approveBtn: { background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  rejectBtn: { background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' },
  listHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' },
  filterControls: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  select: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', minWidth: '150px' },
  tableContainer: { overflowX: 'auto', width: '100%', background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '600px' },
  th: { padding: '15px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #dee2e6', fontWeight: 'bold', color: '#495057' },
  td: { padding: '15px', textAlign: 'left', borderBottom: '1px solid #eee' },
  row: { transition: 'background-color 0.2s' },
  roleTag: { background: '#ffc107', color: 'black', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' },
  logoutBtn: { background: 'transparent', border: '1px solid white', color: 'white', cursor: 'pointer', padding: '5px 12px', borderRadius: '4px', transition: 'background 0.2s' },
  footer: { textAlign: 'center', padding: '20px', background: '#ffffff', borderTop: '1px solid #eee', color: '#666', width: '100%', boxSizing: 'border-box' },
  loginBox: { maxWidth: '400px', margin: '10vh auto', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', boxSizing: 'border-box', width: '90%' }
};

export default App;

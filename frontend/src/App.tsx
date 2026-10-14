import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import {
  Activity as ActivityIcon, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  Check, CheckCheck, CheckCircle2, ChevronDown, ChevronRight, Circle,
  Clock3, Columns3, Command, Ellipsis, FolderKanban, LayoutDashboard,
  ListTodo, LoaderCircle, LogOut, Menu, MoreHorizontal, Pencil,
  Plus, Search, ShieldCheck, Sparkles, Trash2, TrendingUp, X
} from 'lucide-react';
import { api } from './api';
import type { AuthResult, Dashboard, Priority, Project, ProjectInput, Status, Task, TaskInput, User, View } from './api';

const statuses: Status[] = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
const statusNames: Record<Status, string> = { TODO: 'To do', IN_PROGRESS: 'In progress', REVIEW: 'In review', DONE: 'Completed' };
const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const priorityNames: Record<Priority, string> = { LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent' };
const pageNames: Record<View, string> = { overview: 'Overview', board: 'Kanban board', tasks: 'All tasks', projects: 'Projects' };
const projectColors = ['#7c5cfc', '#13b8a6', '#f59e5b', '#e97594', '#4597ee', '#9c83c4'];
const emptyDashboard: Dashboard = { totalProjects: 0, totalTasks: 0, doneTasks: 0, inProgressTasks: 0, overdueTasks: 0, upcomingTasks: [], activity: [] };
function initials(name: string) { return name.split(' ').filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase(); }
function due(date: string | null) { return date ? new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'; }
function when(date: string) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  return days <= 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
}
function isOverdue(t: Task) { const d = new Date(); const today = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; return !!t.dueDate && t.status !== 'DONE' && t.dueDate < today; }
function pct(tasks: Task[]) { return tasks.length ? Math.round(100 * tasks.filter(t => t.status === 'DONE').length / tasks.length) : 0; }
function IconBadge({ children, color }: { children: ReactNode; color: string }) { return <div className="icon-badge" style={{ color, background: `${color}14` }}>{children}</div>; }
function PriorityPill({ value }: { value: Priority }) { return <span className={`priority priority-${value.toLowerCase()}`}><span className="priority-dot"/>{priorityNames[value]}</span>; }
function StatusPill({ value }: { value: Status }) { return <span className={`status status-${value.toLowerCase()}`}>{value === 'DONE' && <Check size={12}/>} {statusNames[value]}</span>; }
function EmptyState({ icon, title, message, action }: { icon: ReactNode; title: string; message: string; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h3>{title}</h3><p>{message}</p>{action}</div>;
}

function AuthPage({ onAuth }: { onAuth: (auth: AuthResult) => void }) {
  const [mode, setMode] = useState<'login'|'register'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const result = await api<AuthResult>(`/auth/${mode}`, undefined, {
        method: 'POST', body: JSON.stringify(mode === 'register' ? { fullName, email, password } : { email, password })
      });
      onAuth(result);
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <div className="auth-layout">
    <div className="auth-brand-panel">
      <div className="auth-brand"><div className="logo-mark"><Command size={21}/></div><span>devflow<span className="brand-dot">.</span></span></div>
      <div className="auth-message"><div className="eyebrow light-eyebrow"><Sparkles size={15}/> A better way to work</div>
        <h1>Make space for<br/><em>brilliant work.</em></h1>
        <p>The beautifully simple workspace to plan projects, move tasks forward, and celebrate progress.</p>
      </div>
      <div className="auth-mock">
        <div className="mock-top"><span className="mock-light"/><span className="mock-light"/><span className="mock-light"/><span className="mock-heading">Team workspace</span></div>
        <div className="mock-columns">
          <div className="mock-col"><span>TO DO</span><div className="mock-task"><div className="mock-tag purple"/><div className="mock-line wide"/><div className="mock-line short"/><div className="mock-foot"/></div><div className="mock-task"><div className="mock-tag orange"/><div className="mock-line mid"/><div className="mock-line short"/></div></div>
          <div className="mock-col"><span>IN PROGRESS</span><div className="mock-task"><div className="mock-tag teal"/><div className="mock-line wide"/><div className="mock-line mid"/><div className="mock-foot"/></div><div className="mock-task small-task"><div className="mock-line short"/></div></div>
          <div className="mock-col"><span>DONE ✨</span><div className="mock-task"><div className="mock-tag green"/><div className="mock-line wide"/><div className="mock-line mid"/><div className="mock-foot"/></div></div>
        </div>
      </div>
      <div className="auth-quote">Built for focus. Designed for momentum.</div>
    </div>
    <div className="auth-form-panel">
      <div className="auth-mobile-logo"><div className="logo-mark"><Command size={18}/></div>devflow<span className="brand-dot">.</span></div>
      <div className="auth-content"><span className="form-kicker">WELCOME TO DEVFLOW</span>
        <h2>{mode === 'register' ? 'Start your journey.' : 'Welcome back.'}</h2>
        <p>{mode === 'register' ? 'Create your free workspace and bring your ideas to life.' : 'Log in to pick up right where you left off.'}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label>Full name<input required minLength={2} maxLength={100} autoComplete="name" placeholder="Alex Morgan" value={fullName} onChange={e => setFullName(e.target.value)}/></label>}
          <label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/></label>
          <label>Password<input required type="password" minLength={mode === 'register' ? 8 : undefined} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)}/></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="btn btn-primary wide-button" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null}{mode === 'register' ? 'Create workspace' : 'Sign in'} <ArrowRight size={17}/></button>
        </form>
        <div className="switch-auth">{mode === 'register' ? 'Already have an account?' : 'New to DevFlow?'} <button className="link-button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>{mode === 'register' ? 'Sign in' : 'Create an account'}</button></div>
        <div className="auth-privacy"><ShieldCheck size={15}/> Your workspace is private to your account.</div>
      </div>
    </div>
  </div>;
}

function TaskModal({ task, projects, defaultProject, onClose, onSave, onDelete }: {
  task: Task | null; projects: Project[]; defaultProject: number | null;
  onClose: () => void; onSave: (input: TaskInput) => Promise<void>; onDelete: (id: number) => Promise<void>;
}) {
  const [form, setForm] = useState<TaskInput>({
    projectId: task?.projectId ?? defaultProject ?? projects[0]?.id ?? 0, title: task?.title ?? '',
    description: task?.description ?? '', status: task?.status ?? 'TODO', priority: task?.priority ?? 'MEDIUM', dueDate: task?.dueDate ?? null
  });
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent) { e.preventDefault(); setBusy(true); try { await onSave(form); } finally { setBusy(false); } }
  return <div className="modal-overlay" onMouseDown={e => { if(e.target === e.currentTarget) onClose(); }}>
    <div className="modal-card" role="dialog" aria-modal="true" aria-label={task ? 'Edit task' : 'Create task'}>
      <div className="modal-heading"><div><div className="modal-kicker">TASK DETAILS</div><h2>{task ? 'Edit task' : 'Create a task'}</h2></div><button className="icon-button" title="Close" onClick={onClose}><X size={20}/></button></div>
      <form onSubmit={save} className="modal-form">
        <label>Task title <input autoFocus required maxLength={160} placeholder="e.g. Review homepage design" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}/></label>
        <label>Project<select required value={form.projectId} onChange={e => setForm({ ...form, projectId: Number(e.target.value) })}>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
        <div className="two-fields"><label>Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>{statuses.map(s => <option key={s} value={s}>{statusNames[s]}</option>)}</select></label>
        <label>Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Priority })}>{priorities.map(p => <option key={p} value={p}>{priorityNames[p]}</option>)}</select></label></div>
        <label>Due date <input type="date" value={form.dueDate ?? ''} onChange={e => setForm({ ...form, dueDate: e.target.value || null })}/></label>
        <label>Description <textarea rows={3} maxLength={3500} placeholder="Add some details (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
        <div className="modal-actions">{task && <button type="button" className="btn btn-danger-text" disabled={busy} onClick={() => onDelete(task.id)}><Trash2 size={16}/> Delete</button>}<div className="spacer"/><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button className="btn btn-primary" type="submit" disabled={busy || !form.projectId}>{busy ? <LoaderCircle className="spin" size={16}/> : <Check size={16}/>} {task ? 'Save changes' : 'Create task'}</button></div>
      </form>
    </div>
  </div>;
}
function ProjectModal({ project, onClose, onSave, onDelete }: {
  project: Project | null; onClose: () => void; onSave: (input: ProjectInput) => Promise<void>; onDelete: (id: number) => Promise<void>;
}) {
  const [form, setForm] = useState<ProjectInput>({ name: project?.name ?? '', description: project?.description ?? '', color: project?.color ?? projectColors[0] });
  const [busy, setBusy] = useState(false);
  async function save(e: FormEvent) { e.preventDefault(); setBusy(true); try { await onSave(form); } finally { setBusy(false); } }
  return <div className="modal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-card" role="dialog" aria-modal="true" aria-label="Project details">
    <div className="modal-heading"><div><div className="modal-kicker">WORKSPACE</div><h2>{project ? 'Edit project' : 'New project'}</h2></div><button className="icon-button" title="Close" onClick={onClose}><X size={20}/></button></div>
    <form className="modal-form" onSubmit={save}>
      <label>Project name<input autoFocus required maxLength={110} placeholder="e.g. Website redesign" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
      <label>Description<textarea rows={3} maxLength={1500} placeholder="What is this project about?" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}/></label>
      <div className="field-label">Project color</div><div className="color-picker">{projectColors.map(c => <button key={c} type="button" className={`color-choice ${c.toLowerCase() === form.color.toLowerCase() ? 'color-picked' : ''}`} style={{ background: c }} onClick={() => setForm({ ...form, color: c })} aria-label={`Choose ${c}`}>{c.toLowerCase() === form.color.toLowerCase() && <Check size={17}/>}</button>)}</div>
      <div className="modal-actions">{project && <button type="button" className="btn btn-danger-text" disabled={busy} onClick={() => onDelete(project.id)}><Trash2 size={16}/> Delete</button>}<div className="spacer"/><button type="button" className="btn btn-light" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16}/> : <Check size={16}/>} {project ? 'Save changes' : 'Create project'}</button></div>
    </form>
  </div></div>;
}

export default function App() {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('devflow_token'));
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard>(emptyDashboard);
  const [loading, setLoading] = useState(!!sessionStorage.getItem('devflow_token'));
  const [page, setPage] = useState<View>('overview');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState<number | null>(null);
  const [taskModal, setTaskModal] = useState<Task | 'new' | null>(null);
  const [projectModal, setProjectModal] = useState<Project | 'new' | null>(null);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);

  const notify = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3900); }, []);
  const logout = useCallback(() => { sessionStorage.removeItem('devflow_token'); setToken(null); setUser(null); setProjects([]); setTasks([]); }, []);
  const refresh = useCallback(async (key: string) => {
    const [ps, ts, ds] = await Promise.all([
      api<Project[]>('/projects', key), api<Task[]>('/tasks', key), api<Dashboard>('/dashboard', key)
    ]);
    setProjects(ps); setTasks(ts); setDashboard(ds);
  }, []);
  useEffect(() => {
    function shortcuts(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); document.querySelector<HTMLInputElement>('.search-box input')?.focus();
      }
      if (e.key === 'Escape') { setTaskModal(null); setProjectModal(null); }
    }
    document.addEventListener('keydown', shortcuts);
    return () => document.removeEventListener('keydown', shortcuts);
  }, []);
  useEffect(() => {
    function unauthorized() { logout(); }
    window.addEventListener('devflow:unauthorized', unauthorized);
    return () => window.removeEventListener('devflow:unauthorized', unauthorized);
  }, [logout]);
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const me = await api<User>('/auth/me', token);
        if (!cancelled) { setUser(me); await refresh(token); }
      } catch (e) { if (!cancelled) { notify((e as Error).message); logout(); } }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [token, refresh, logout, notify]);

  const matchingTasks = useMemo(() => tasks.filter(t =>
    (projectFilter === null || t.projectId === projectFilter) &&
    `${t.title} ${t.description} ${t.projectName}`.toLowerCase().includes(search.toLowerCase())
  ), [tasks, projectFilter, search]);
  const matchingProjects = useMemo(() => projects.filter(p =>
    `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())
  ), [projects, search]);
  const activeProject = projects.find(p => p.id === projectFilter);
  const completedPercent = pct(tasks);

  async function mutation(work: () => Promise<unknown>, success: string) {
    if (!token) return;
    try { await work(); await refresh(token); notify(success); }
    catch (e) { notify(`Error: ${(e as Error).message}`); throw e; }
  }
  async function saveTask(input: TaskInput) {
    if (!token) return;
    try {
      await mutation(() => api(taskModal && taskModal !== 'new' ? `/tasks/${taskModal.id}` : '/tasks', token, {
        method: taskModal && taskModal !== 'new' ? 'PUT' : 'POST', body: JSON.stringify(input)
      }), taskModal && taskModal !== 'new' ? 'Task updated' : 'Task created');
      setTaskModal(null);
    } catch { /* Error already displayed; keep form open */ }
  }
  async function removeTask(id: number) {
    if (!token || !window.confirm('Delete this task permanently?')) return;
    try { await mutation(() => api<void>(`/tasks/${id}`, token, { method: 'DELETE' }), 'Task deleted'); setTaskModal(null); }
    catch { /* Feedback already shown */ }
  }
  async function moveTask(id: number, status: Status) {
    if (!token) return;
    try { await mutation(() => api(`/tasks/${id}/status`, token, { method: 'PATCH', body: JSON.stringify({ status }) }), 'Task moved'); }
    catch { /* Feedback already shown */ }
  }
  async function saveProject(input: ProjectInput) {
    if (!token) return;
    try {
      await mutation(() => api(projectModal && projectModal !== 'new' ? `/projects/${projectModal.id}` : '/projects', token, {
        method: projectModal && projectModal !== 'new' ? 'PUT' : 'POST', body: JSON.stringify(input)
      }), projectModal && projectModal !== 'new' ? 'Project updated' : 'Project created');
      setProjectModal(null);
    } catch { /* Keep form open */ }
  }
  async function removeProject(id: number) {
    if (!token || !window.confirm('Delete this project and ALL of its tasks permanently?')) return;
    try { await mutation(() => api<void>(`/projects/${id}`, token, { method: 'DELETE' }), 'Project deleted'); setProjectFilter(null); setProjectModal(null); }
    catch { /* Feedback already shown */ }
  }
  function choosePage(p: View) { setPage(p); setSidebarOpen(false); setSearch(''); }
  function openTask() { if (projects.length) setTaskModal('new'); else { setProjectModal('new'); notify('Create a project first to add tasks'); } }
  function onAuth(result: AuthResult) { sessionStorage.setItem('devflow_token', result.token); setUser(result.user); setToken(result.token); }

  if (!token) return <AuthPage onAuth={onAuth}/>;
  if (loading || !user) return <div className="loading-screen"><div className="logo-mark"><Command size={23}/></div><LoaderCircle className="spin" size={28}/><p>Preparing your workspace...</p></div>;
  return <div className="app-shell">
    {sidebarOpen && <button className="mobile-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close menu"/>}
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-head"><div className="logo-mark"><Command size={21}/></div><span className="brand-name">devflow<span className="brand-dot">.</span></span><button className="mobile-close icon-button" onClick={() => setSidebarOpen(false)}><X size={19}/></button></div>
      <div className="workspace-select"><div className="workspace-avatar">D</div><div className="workspace-copy"><strong>My Workspace</strong><small>Personal workspace</small></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="nav-menu" aria-label="Main navigation">
        <button className={`nav-link ${page === 'overview' ? 'active' : ''}`} onClick={() => choosePage('overview')}><LayoutDashboard size={19}/> Overview</button>
        <button className={`nav-link ${page === 'tasks' ? 'active' : ''}`} onClick={() => choosePage('tasks')}><ListTodo size={19}/> My tasks <span className="nav-count">{tasks.length}</span></button>
        <button className={`nav-link ${page === 'board' ? 'active' : ''}`} onClick={() => choosePage('board')}><Columns3 size={19}/> Kanban board</button>
        <button className={`nav-link ${page === 'projects' ? 'active' : ''}`} onClick={() => choosePage('projects')}><FolderKanban size={19}/> Projects <span className="nav-count">{projects.length}</span></button>
      </nav>
      <div className="sidebar-projects-head"><span>YOUR PROJECTS</span><button className="icon-button mini-icon" title="New project" onClick={() => setProjectModal('new')}><Plus size={16}/></button></div>
      <div className="sidebar-projects">{projects.slice(0, 6).map(p => <button key={p.id} className="project-link" onClick={() => { setProjectFilter(p.id); choosePage('board'); }}><span className="project-color" style={{ background: p.color }}/><span>{p.name}</span></button>)}{!projects.length && <span className="sidebar-muted">No projects yet</span>}</div>
      <div className="sidebar-bottom"><div className="upgrade-card"><span className="upgrade-spark"><Sparkles size={17}/></span><strong>Stay in your flow</strong><span>Little steps lead to big things. Keep it moving!</span><button onClick={openTask}>Add a task <ArrowRight size={15}/></button></div><div className="sidebar-user"><div className="user-avatar">{initials(user.fullName)}</div><div className="user-copy"><strong>{user.fullName}</strong><span>{user.email}</span></div><button onClick={logout} className="icon-button" title="Log out"><LogOut size={19}/></button></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="topbar-left"><button className="mobile-toggle icon-button" onClick={() => setSidebarOpen(true)}><Menu size={23}/></button><span className="breadcrumb">Workspace</span><ChevronRight size={15}/><strong>{pageNames[page]}</strong></div>
        <div className="topbar-actions"><div className="search-box"><Search size={17}/><input aria-label="Search" placeholder="Search your workspace..." value={search} onChange={e => { setSearch(e.target.value); if (e.target.value && page === 'overview') setPage('tasks'); }}/><span className="search-kbd">⌘ K</span></div><button className="icon-button notification-icon" title={`${dashboard.overdueTasks} overdue tasks`} onClick={() => choosePage('tasks')}><Bell size={19}/>{dashboard.overdueTasks > 0 && <span className="notification-dot"/>}</button><span className="header-divider"/><div className="top-avatar" title={user.fullName}>{initials(user.fullName)}</div></div>
      </header>
      <div className="content-wrapper">
        {page === 'overview' && <>
          <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR WORKSPACE, AT A GLANCE</div><h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.fullName.split(' ')[0]} <span className="wave">✦</span></h1><p>Here's what's happening with your projects today.</p></div><button className="btn btn-primary" onClick={openTask}><Plus size={18}/> New task</button></div>
          <div className="welcome-banner"><div className="banner-contents"><span className="banner-chip"><Sparkles size={14}/> WORK SMARTER, EVERY DAY</span><h2>Make today count.</h2><p>Turn your big ideas into small wins. Your best work starts with a clear plan.</p><button className="banner-button" onClick={() => choosePage('board')}>Go to my board <ArrowRight size={16}/></button></div><div className="banner-art" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="orbit orbit-three"/><div className="banner-floating float-one"><CheckCircle2 size={22}/> <span>Task completed!</span></div><div className="banner-floating float-two"><TrendingUp size={20}/> <span>Keep it up</span></div></div></div>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-top"><IconBadge color="#7c5cfc"><FolderKanban size={20}/></IconBadge><span className="stat-note"><ArrowUpRight size={13}/> Workspace</span></div><div className="stat-number">{dashboard.totalProjects}</div><div className="stat-label">Active projects</div></div>
            <div className="stat-card"><div className="stat-top"><IconBadge color="#298be8"><ListTodo size={20}/></IconBadge><span className="stat-note">All time</span></div><div className="stat-number">{dashboard.totalTasks}</div><div className="stat-label">Total tasks</div></div>
            <div className="stat-card"><div className="stat-top"><IconBadge color="#12a88e"><CheckCheck size={20}/></IconBadge><span className="stat-note positive"><ArrowUpRight size={13}/> {completedPercent}% done</span></div><div className="stat-number">{dashboard.doneTasks}</div><div className="stat-label">Tasks completed</div></div>
            <div className="stat-card"><div className="stat-top"><IconBadge color="#f19a57"><Clock3 size={20}/></IconBadge><span className="stat-note">Needs attention</span></div><div className="stat-number">{dashboard.inProgressTasks}</div><div className="stat-label">In progress</div></div>
          </div>
          <div className="dashboard-panels"><section className="panel progress-panel"><div className="panel-heading"><div><h3>Task overview</h3><p>Progress across all your projects</p></div><span className="heading-icon"><MoreHorizontal size={19}/></span></div><div className="progress-visual"><div className="donut" style={{ background: `conic-gradient(#7c5cfc 0 ${completedPercent}%, #e9ebf4 ${completedPercent}% 100%)` }}><div className="donut-hole"><strong>{completedPercent}%</strong><span>completed</span></div></div><div className="progress-legend">{statuses.map(s => <div key={s} className="legend-row"><span className={`legend-dot legend-${s.toLowerCase()}`}/><span>{statusNames[s]}</span><strong>{tasks.filter(t => t.status === s).length}</strong></div>)}</div></div></section>
          <section className="panel deadlines-panel"><div className="panel-heading"><div><h3>Upcoming deadlines</h3><p>Stay ahead of what's next</p></div><button className="text-action" onClick={() => choosePage('tasks')}>View all <ArrowRight size={15}/></button></div>
            <div className="deadline-items">{dashboard.upcomingTasks.length ? dashboard.upcomingTasks.slice(0, 4).map(t => <button className="deadline-row" onClick={() => setTaskModal(t)} key={t.id}><div className="deadline-icon"><CalendarDays size={18}/></div><div className="deadline-text"><strong>{t.title}</strong><span>{t.projectName}</span></div><div className={`deadline-date ${isOverdue(t) ? 'late' : ''}`}>{due(t.dueDate)}</div></button>) : <EmptyState icon={<CalendarDays size={22}/>} title="No upcoming deadlines" message="Your calendar is looking clear."/>}</div>
          </section></div>
          <div className="section-title"><div><h2>Your projects</h2><p>A little progress every day adds up.</p></div><button className="text-action" onClick={() => choosePage('projects')}>All projects <ArrowRight size={16}/></button></div>
          <div className="project-cards">{projects.slice(0,3).map(p => {
            const projectTasks = tasks.filter(t => t.projectId === p.id);
            return <button className="project-card" key={p.id} onClick={() => { setProjectFilter(p.id); choosePage('board'); }}><div className="project-card-top"><div className="project-symbol" style={{ background: `${p.color}1b`, color: p.color }}><FolderKanban size={21}/></div><ArrowUpRight size={19} className="subtle-icon"/></div><h3>{p.name}</h3><p>{p.description || 'All the tasks and ideas in one place.'}</p><div className="project-progress-label"><span>Progress</span><strong>{pct(projectTasks)}%</strong></div><div className="progress-bar"><span style={{ width: `${pct(projectTasks)}%`, background: p.color }}/></div><div className="project-foot"><span><ListTodo size={15}/> {projectTasks.length} tasks</span><span>Open board <ArrowRight size={14}/></span></div></button>;
          })}{projects.length === 0 && <div className="panel"><EmptyState icon={<FolderKanban size={24}/>} title="Create your first project" message="Give your work a home to get started." action={<button className="btn btn-primary" onClick={() => setProjectModal('new')}><Plus size={16}/> New project</button>}/></div>}</div>
          <section className="panel activity-panel"><div className="panel-heading"><div><h3>Recent activity</h3><p>Your team's latest updates</p></div><ActivityIcon size={18} className="subtle-icon"/></div><div className="activity-list">{dashboard.activity.length ? dashboard.activity.slice(0,5).map(a => <div className="activity-row" key={a.id}><div className="activity-icon"><CheckCircle2 size={16}/></div><div><strong>{a.detail}</strong><span>{a.action.toLowerCase().replaceAll('_',' ')} · {when(a.createdAt)}</span></div></div>) : <div className="muted-padding">Your changes will show up here.</div>}</div></section>
        </>}
        {page === 'board' && <>
          <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot"/> WORKFLOW VIEW</div><h1>Kanban board</h1><p>Drag cards between columns to keep your work moving.</p></div><button className="btn btn-primary" onClick={openTask}><Plus size={18}/> New task</button></div>
          <div className="filter-line"><span>Project</span><select value={projectFilter ?? ''} onChange={e => setProjectFilter(e.target.value ? Number(e.target.value) : null)}><option value="">All projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><span className="filter-info">{matchingTasks.length} tasks</span></div>
          <div className="kanban-board">{statuses.map(s => <div className="kanban-column" key={s} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const id = Number(e.dataTransfer.getData('text/plain')); setDragging(null); const task = tasks.find(t => t.id === id); if (task && task.status !== s) void moveTask(id, s); }}><div className="column-heading"><div><span className={`column-dot column-${s.toLowerCase()}`}/><strong>{statusNames[s]}</strong><span className="column-count">{matchingTasks.filter(t => t.status === s).length}</span></div><button className="icon-button" title="Add task" onClick={openTask}><Plus size={17}/></button></div>
            <div className="column-body">{matchingTasks.filter(t => t.status === s).map(t => <button key={t.id} draggable onDragStart={e => { setDragging(t.id); e.dataTransfer.setData('text/plain', String(t.id)); }} onDragEnd={() => setDragging(null)} className={`kanban-task ${dragging === t.id ? 'task-dragging' : ''}`} onClick={() => setTaskModal(t)}><div className="card-topline"><PriorityPill value={t.priority}/><MoreHorizontal size={16}/></div><h3>{t.title}</h3><p>{t.description || 'Click to add a description'}</p><div className="kanban-task-foot"><span className="mini-project"><span style={{ background: projects.find(p => p.id === t.projectId)?.color ?? '#7c5cfc' }}/>{t.projectName}</span><span className={`mini-date ${isOverdue(t) ? 'late' : ''}`}><CalendarDays size={13}/>{due(t.dueDate)}</span></div></button>)}<button className="add-task-inline" onClick={openTask}><Plus size={16}/> Add a task</button></div></div>)}</div>
        </>}
        {page === 'tasks' && <>
          <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot"/> TASK MANAGEMENT</div><h1>All tasks</h1><p>Every important detail, all in one place.</p></div><button className="btn btn-primary" onClick={openTask}><Plus size={18}/> New task</button></div>
          <div className="panel tasks-panel"><div className="table-toolbar"><div className="table-heading"><ListTodo size={19}/><strong>Tasks <span>{matchingTasks.length}</span></strong></div><div className="filter-line compact-filter"><select aria-label="Filter by project" value={projectFilter ?? ''} onChange={e => setProjectFilter(e.target.value ? Number(e.target.value) : null)}><option value="">All projects</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div></div>
            {matchingTasks.length ? <div className="table-scroll"><table className="tasks-table"><thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Due date</th><th></th></tr></thead><tbody>{matchingTasks.map(t => <tr key={t.id} onClick={() => setTaskModal(t)}><td><span className="task-title">{t.status === 'DONE' ? <CheckCircle2 size={18} className="done-icon"/> : <Circle size={18} className="open-icon"/>}{t.title}</span></td><td><span className="table-project"><span className="project-color" style={{ background: projects.find(p => p.id === t.projectId)?.color }}/>{t.projectName}</span></td><td><StatusPill value={t.status}/></td><td><PriorityPill value={t.priority}/></td><td><span className={`due-table ${isOverdue(t) ? 'late' : ''}`}>{due(t.dueDate)}</span></td><td><Pencil size={15} className="subtle-icon"/></td></tr>)}</tbody></table></div> : <EmptyState icon={<ListTodo size={25}/>} title="No tasks found" message="Try another search, or create your next task." action={<button className="btn btn-primary" onClick={openTask}><Plus size={16}/> Add task</button>}/>}
          </div>
        </>}
        {page === 'projects' && <>
          <div className="page-intro"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR PROJECT PORTFOLIO</div><h1>Projects</h1><p>Everything you're working on, beautifully organized.</p></div><button className="btn btn-primary" onClick={() => setProjectModal('new')}><Plus size={18}/> New project</button></div>
          <div className="projects-summary"><span>{projects.length} projects</span><span className="summary-divider"/><span>{tasks.length} tasks across your workspace</span></div>
          <div className="project-cards project-page-cards">{matchingProjects.map(p => {
            const projectTasks = tasks.filter(t => t.projectId === p.id);
            return <div className="project-card" key={p.id}><div className="project-card-top"><div className="project-symbol" style={{ background: `${p.color}1b`, color: p.color }}><FolderKanban size={21}/></div><button className="icon-button" title="Edit project" onClick={() => setProjectModal(p)}><Ellipsis size={21}/></button></div><h3>{p.name}</h3><p>{p.description || 'Add a description to this project.'}</p><div className="project-progress-label"><span>Progress</span><strong>{pct(projectTasks)}%</strong></div><div className="progress-bar"><span style={{ width: `${pct(projectTasks)}%`, background: p.color }}/></div><div className="project-foot"><span><ListTodo size={15}/> {projectTasks.length} tasks</span><button onClick={() => { setProjectFilter(p.id); choosePage('board'); }} className="text-action">Open board <ArrowRight size={14}/></button></div></div>;
          })}<button className="new-project-card" onClick={() => setProjectModal('new')}><span><Plus size={22}/></span><strong>Create a project</strong><small>Bring a new idea to life</small></button></div>
        </>}
      </div>
    </main>
    {taskModal && <TaskModal key={taskModal === 'new' ? 'new' : taskModal.id} task={taskModal === 'new' ? null : taskModal} projects={projects} defaultProject={projectFilter} onClose={() => setTaskModal(null)} onSave={saveTask} onDelete={removeTask}/>}
    {projectModal && <ProjectModal key={projectModal === 'new' ? 'new' : projectModal.id} project={projectModal === 'new' ? null : projectModal} onClose={() => setProjectModal(null)} onSave={saveProject} onDelete={removeProject}/>}
    {toast && <div className={`toast ${toast.startsWith('Error') || toast.startsWith('Cannot') ? 'toast-error' : ''}`} role="status"><CheckCircle2 size={17}/>{toast}<button title="Dismiss" onClick={() => setToast('')}><X size={15}/></button></div>}
    <span className="sr-only">{activeProject ? `Viewing ${activeProject.name}` : 'Viewing all projects'}</span>
  </div>;
}

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProject, listTasks, createTask, updateTask, listUsers } from "../lib/api.js";
import { socket } from "../lib/socket.js";

export default function ProjectDetail(){
  const { id } = useParams();
  const pid = Number(id);
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ title:"", assigneeId:"", status:"todo" });
  const [error, setError] = useState("");

  const loadAll = async () => {
    try {
      setError("");
      const [p, t, u] = await Promise.all([getProject(pid), listTasks(pid), listUsers()]);
      setProject(p); setTasks(t); setUsers(u);
    } catch (e) {
      console.error("Error loadAll:", e);
      setError("No se pudo cargar el proyecto/tareas/usuarios.");
    }
  };

  useEffect(() => {
    if (!Number.isFinite(pid)) return;
    loadAll();
    socket.emit("joinProject", pid);

    const onCreated = ({ projectId, task }) => { if(projectId===pid) setTasks(prev=>[task, ...prev]); };
    const onUpdated = ({ projectId, task }) => { if(projectId===pid) setTasks(prev=> prev.map(x=> x.id===task.id ? task : x)); };
    const onDeleted = ({ projectId, taskId }) => { if(projectId===pid) setTasks(prev=> prev.filter(x=> x.id!==taskId)); };

    socket.on("task:created", onCreated);
    socket.on("task:updated", onUpdated);
    socket.on("task:deleted", onDeleted);
    return () => {
      socket.off("task:created", onCreated);
      socket.off("task:updated", onUpdated);
      socket.off("task:deleted", onDeleted);
    };
  }, [pid]);

  const onCreate = async (e) => {
    e.preventDefault();
    try {
      if(!form.title) return alert("Título requerido");
      await createTask(pid, {
        title: form.title,
        status: form.status,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null
      });
      setForm({ title:"", assigneeId:"", status:"todo" });
    } catch (e) {
      console.error("Error createTask:", e);
      setError("No se pudo crear la tarea.");
    }
  };

  const onStatusChange = async (task, status) => {
    try {
      await updateTask(task.id, { status });
    } catch (e) {
      console.error("Error updateTask:", e);
      setError("No se pudo actualizar la tarea.");
    }
  };

  if(!project) return <p>Cargando…</p>;

  const by = s => tasks.filter(t=>t.status===s);

  return (
    <>
      <h1>{project.name}</h1>
      {error && <p style={{color:"crimson"}}>{error}</p>}

      <form className="card" onSubmit={onCreate}>
        <label>Título <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required /></label>
        <label>Asignar a
          <select value={form.assigneeId} onChange={e=>setForm({...form, assigneeId:e.target.value})}>
            <option value="">—</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label>Estado
          <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})}>
            <option value="todo">To Do</option>
            <option value="doing">Doing</option>
            <option value="done">Done</option>
          </select>
        </label>
        <button className="btn">Crear tarea</button>
      </form>

      <div className="grid" style={{marginTop:"1rem"}}>
        <Column title="To Do"  items={by("todo")}  onStatusChange={onStatusChange} />
        <Column title="Doing" items={by("doing")} onStatusChange={onStatusChange} />
        <Column title="Done"  items={by("done")}  onStatusChange={onStatusChange} />
      </div>
    </>
  );
}

function Column({ title, items, onStatusChange }){
  return (
    <div className="card">
      <h3 style={{marginTop:0}}>{title}</h3>
      {items.length===0 && <p>—</p>}
      {items.map(t=>(
        <div key={t.id} style={{borderBottom:"1px solid #e5e7eb", padding:".5rem 0"}}>
          <strong>{t.title}</strong>
          <div style={{fontSize:12, opacity:.7}}>Asignado: {t.assignee?.name || "—"}</div>
          <div style={{marginTop:".25rem"}}>
            <label>Estado: </label>
            <select value={t.status} onChange={e=>onStatusChange(t, e.target.value)}>
              <option value="todo">To Do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}

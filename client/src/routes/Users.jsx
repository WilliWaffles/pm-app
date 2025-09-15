import { useEffect, useState } from "react";
import { listUsers, createUser, updateUser, deleteUser } from "../lib/api.js";

export default function Users(){
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name:"", email:"" });
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name:"", email:"" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const load = async () => {
    try {
      setError("");
      const data = await listUsers();
      setItems(data);
    } catch (e) {
      console.error("Error listUsers:", e);
      setError("No se pudieron cargar los usuarios.");
    }
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if(!form.name || !form.email) return alert("Completa los campos");
      await createUser(form);
      setForm({name:"", email:""});
      await load();
    } catch (e) {
      console.error("Error createUser:", e);
      setError(e?.response?.data?.error || "No se pudo crear el usuario.");
    }
  };

  const startEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name:"", email:"" });
  };

  const saveEdit = async (id) => {
    try {
      if(!editForm.name || !editForm.email) return alert("Completa los campos");
      await updateUser(id, editForm);
      cancelEdit();
      await load();
    } catch (e) {
      console.error("Error updateUser:", e);
      setError(e?.response?.data?.error || "No se pudo actualizar el usuario.");
    }
  };

  const askDelete = (id) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);

  const doDelete = async () => {
    if(!confirmDeleteId) return;
    try {
      await deleteUser(confirmDeleteId);
      cancelDelete();
      await load();
    } catch (e) {
      console.error("Error deleteUser:", e);
      setError(e?.response?.data?.error || "No se pudo eliminar el usuario.");
    }
  };

  return (
    <>
      <h1>Usuarios</h1>

      <form className="card" onSubmit={onSubmit} aria-label="Crear usuario">
        <label>Nombre
          <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        </label>
        <label>Email
          <input type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required />
        </label>
        <button className="btn" type="submit">Crear</button>
      </form>

      {error && <p style={{color:"crimson"}}>{error}</p>}

      <div className="card" style={{marginTop:"1rem"}}>
        <h3 style={{marginTop:0}}>Lista de usuarios</h3>
        {items.length === 0 && <p>—</p>}
        <ul style={{listStyle:"none", padding:0, margin:0}}>
          {items.map(u=>(
            <li key={u.id} style={{display:"flex", alignItems:"center", justifyContent:"space-between", borderBottom:"1px solid #e5e7eb", padding:".5rem 0"}}>
              {editingId === u.id ? (
                <div style={{flex:1, marginRight:"1rem"}}>
                  <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:".5rem"}}>
                    <input value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} placeholder="Nombre" />
                    <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} placeholder="Email" />
                  </div>
                </div>
              ) : (
                <div style={{flex:1, marginRight:"1rem"}}>
                  <strong>{u.name}</strong> — <span style={{opacity:.8}}>{u.email}</span>
                </div>
              )}

              <div style={{display:"flex", gap:".5rem"}}>
                {editingId === u.id ? (
                  <>
                    <button className="btn" onClick={()=>saveEdit(u.id)} type="button">Guardar</button>
                    <button className="btn" onClick={cancelEdit} type="button" style={{background:"#6b7280"}}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button className="btn" onClick={()=>startEdit(u)} type="button">Editar</button>
                    <button className="btn" onClick={()=>askDelete(u.id)} type="button" style={{background:"#ef4444"}}>Eliminar</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Confirmación simple de borrado */}
      {confirmDeleteId && (
        <div role="dialog" aria-modal="true" style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,.35)", display:"grid", placeItems:"center"
        }} onClick={cancelDelete}>
          <div className="card" style={{width:"420px"}} onClick={e=>e.stopPropagation()}>
            <h3 style={{marginTop:0}}>Eliminar usuario</h3>
            <p>¿Seguro que deseas eliminar este usuario? Las tareas asignadas quedarán sin asignado.</p>
            <div style={{display:"flex", gap:".5rem", justifyContent:"flex-end"}}>
              <button className="btn" onClick={doDelete} style={{background:"#ef4444"}}>Eliminar</button>
              <button className="btn" onClick={cancelDelete} style={{background:"#6b7280"}}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

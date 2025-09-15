import { useEffect, useState } from "react";
import { listProjects, createProject } from "../lib/api.js";
import { Link } from "react-router-dom";

export default function Projects(){
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name:"", description:"" });
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setError("");
      const data = await listProjects();
      setItems(data);
    } catch (e) {
      console.error("Error listProjects:", e);
      setError("No se pudieron cargar los proyectos.");
    }
  };
  useEffect(() => { load(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      if(!form.name) return alert("Nombre requerido");
      await createProject(form);
      setForm({name:"",description:""});
      await load();
    } catch (e) {
      console.error("Error createProject:", e);
      setError("No se pudo crear el proyecto.");
    }
  };

  return (
    <>
      <h1>Proyectos</h1>
      <form className="card" onSubmit={onSubmit}>
        <label>Nombre <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required /></label>
        <label>Descripción <textarea rows="2" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} /></label>
        <button className="btn" type="submit">Crear</button>
      </form>
      {error && <p style={{color:"crimson"}}>{error}</p>}

      <div className="grid" style={{marginTop:"1rem"}}>
        {items.map(p=>(
          <div key={p.id} className="card">
            <h3 style={{marginTop:0}}>{p.name}</h3>
            <p>{p.description || "—"}</p>
            <Link className="btn" to={`/projects/${p.id}`}>Abrir</Link>
          </div>
        ))}
      </div>
    </>
  );
}

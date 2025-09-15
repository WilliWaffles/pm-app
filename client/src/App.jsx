import { Routes, Route, NavLink } from "react-router-dom";
import Projects from "./routes/Projects.jsx";
import ProjectDetail from "./routes/ProjectDetail.jsx";
import Users from "./routes/Users.jsx";

export default function App(){
  return (
    <>
      <header>
        <div className="container" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <strong>PM App</strong>
          <nav className="nav" aria-label="primary">
            <NavLink to="/">Proyectos</NavLink>
            <NavLink to="/users">Usuarios</NavLink>
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/users" element={<Users />} />
        </Routes>
      </main>

      <footer>
        <div className="container">© {new Date().getFullYear()} PM App</div>
      </footer>
    </>
  );
}

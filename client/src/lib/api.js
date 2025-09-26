import axios from "axios";

// Lee del entorno de Vite o usa localhost como fallback
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export const API = axios.create({ baseURL: BASE_URL });

// Users
export const listUsers    = () => API.get("/api/users").then(r => r.data);
export const createUser   = (data) => API.post("/api/users", data).then(r => r.data);
export const updateUser   = (id, data) => API.put(`/api/users/${id}`, data).then(r => r.data);
export const deleteUser   = (id) => API.delete(`/api/users/${id}`).then(r => r.data);

// Projects
export const listProjects  = () => API.get("/api/projects").then(r => r.data);
export const getProject    = (id) => API.get(`/api/projects/${id}`).then(r => r.data);
export const createProject = (data) => API.post("/api/projects", data).then(r => r.data);

// Tasks
export const listTasks   = (projectId) => API.get(`/api/projects/${projectId}/tasks`).then(r => r.data);
export const createTask  = (projectId, data) => API.post(`/api/projects/${projectId}/tasks`, data).then(r => r.data);
export const updateTask  = (id, data) => API.put(`/api/tasks/${id}`, data).then(r => r.data);
export const deleteTask  = (id) => API.delete(`/api/tasks/${id}`).then(r => r.data);

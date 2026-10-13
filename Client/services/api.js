import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const getTasks = () => API.get('/tasks');
export const createTask = (taskData) => API.post('/tasks', taskData);
export const updateTaskStatus = (id, status) => API.put(`/tasks/${id}`, { status });
export const deleteTask = (id) => API.delete(`/tasks/${id}`);

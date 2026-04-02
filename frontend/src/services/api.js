import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const getLevels = () => axios.get(`${API}/lessons/levels`);
export const getLektions = (id) => axios.get(`${API}/lessons/lektions/${id}`);
export const getVocab = (id) => axios.get(`${API}/lessons/vocab/${id}`);
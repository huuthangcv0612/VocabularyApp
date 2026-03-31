import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const getLevels = () => axios.get(`${API}/levels`);
export const getLektions = (id) => axios.get(`${API}/lektions/${id}`);
export const getVocab = (id) => axios.get(`${API}/vocab/${id}`);
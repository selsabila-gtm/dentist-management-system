// src/services(API calls)/staffApi.js
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

// ROLES
export const fetchRoles = async () => {
  const res = await axios.get(`${API_BASE}/roles`);
  return res.data;
};

export const createRole = async (name) => {
  const res = await axios.post(`${API_BASE}/roles`, { name });
  return res.data;
};

// STAFF
export const fetchStaff = async () => {
  const res = await axios.get(`${API_BASE}/staff`);
  return res.data;
};

export const fetchStaffById = async (id) => {
  const res = await axios.get(`${API_BASE}/staff/${id}`);
  return res.data;
};

export const createStaff = async (payload) => {
  const res = await axios.post(`${API_BASE}/staff`, payload);
  return res.data;
};

export const updateStaff = async (id, payload) => {
  const res = await axios.put(`${API_BASE}/staff/${id}`, payload);
  return res.data;
};

export const deleteStaff = async (id) => {
  await axios.delete(`${API_BASE}/staff/${id}`);
};

export async function login(credentials) {
  const res = await axios.post(`${API_BASE}/login`, credentials);
  return res.data; // { id, username, role }
}
export async function forgotPassword(payload) {
  const res = await axios.post(`${API_BASE}/forgot-password`, payload);
  return res.data; // { message: "Password updated successfully." }
}

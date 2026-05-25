/**
 * api.js - Camada de Serviços HTTP
 * Usado para centralizar requisições e headers (como Bearer Token)
 * Evitando fetch() espalhados nos componentes React
 */

const BASE_URL = 'http://localhost:3001/api';

export const api = {
  async get(endpoint) {
    return fetchAPI(endpoint, { method: 'GET' });
  },
  async post(endpoint, data) {
    return fetchAPI(endpoint, { method: 'POST', body: JSON.stringify(data) });
  },
  async put(endpoint, data) {
    return fetchAPI(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(endpoint) {
    return fetchAPI(endpoint, { method: 'DELETE' });
  }
};

async function fetchAPI(endpoint, options) {
  // Pega token da store Zustand (se aplicável localstorage parseado)
  let token = null;
  try {
    const state = JSON.parse(localStorage.getItem('medai-auth-storage'));
    token = state?.state?.token;
  } catch (e) {}

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição');
  }

  return data;
}

const BASE_URL = '/api';

function getToken() {
  return sessionStorage.getItem('blockdrop_token');
}

async function request(endpoint, options = {}, retries = 1) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.error || 'Error en la solicitud');
    }
    return data;
  } catch (err) {
    if (retries > 0 && (err.name === 'TypeError' || err.message?.includes('fetch'))) {
      await new Promise(r => setTimeout(r, 800));
      return request(endpoint, options, retries - 1);
    }
    if (err.name === 'TypeError' || err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
      throw new Error('Error de conexión con el servidor. Revisa tu conexión e intenta nuevamente.');
    }
    throw err;
  }
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

export default api;

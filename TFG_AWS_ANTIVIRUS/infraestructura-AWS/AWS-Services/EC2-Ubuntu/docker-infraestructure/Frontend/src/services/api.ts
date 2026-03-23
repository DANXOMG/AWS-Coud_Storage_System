const BASE = '/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`
});

export const auth = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en login');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  register: async (email: string, password: string, fullName: string) => {
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error en registro');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: async () => {
    await fetch(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: headers()
    });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  verify: async () => {
    const res = await fetch(`${BASE}/auth/verify`, { headers: headers() });
    if (!res.ok) throw new Error('Token inválido');
    return res.json();
  },

  getUser: () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  },

  isAuthenticated: () => !!localStorage.getItem('token'),

  updateProfile: async (fullName: string) => {
    const res = await fetch(`${BASE}/auth/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ fullName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al actualizar perfil');
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await fetch(`${BASE}/auth/password`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al cambiar contraseña');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return data;
  }
};

export const files = {
  list: async (folderId?: string, search?: string, starred?: boolean) => {
    const params = new URLSearchParams();
    if (folderId) params.append('folderId', folderId);
    if (search) params.append('search', search);
    if (starred) params.append('starred', 'true');
    const res = await fetch(`${BASE}/files?${params}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al listar archivos');
    return data;
  },

  upload: async (file: File, folderId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    const res = await fetch(`${BASE}/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al subir archivo');
    return data;
  },

  view: async (fileId: string) => {
    const res = await fetch(`${BASE}/files/view/${fileId}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener URL');
    return data;
  },

  download: async (fileId: string) => {
    const res = await fetch(`${BASE}/files/download/${fileId}`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al descargar');
    window.open(data.url, '_blank');
    return data;
  },

  createFolder: async (folderName: string, parentFolderId?: string) => {
    const res = await fetch(`${BASE}/files/folder`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ folderName, parentFolderId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al crear carpeta');
    return data;
  },

  star: async (fileId: string, starred: boolean) => {
    const res = await fetch(`${BASE}/files/star/${fileId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ starred })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al destacar');
    return data;
  },

  delete: async (fileId: string) => {
    const res = await fetch(`${BASE}/files/${fileId}`, {
      method: 'DELETE',
      headers: headers()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar');
    return data;
  },

  folders: async () => {
    const res = await fetch(`${BASE}/files/folders`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al listar carpetas');
    return data;
  },

  move: async (fileId: string, targetFolderId: string | null) => {
    const res = await fetch(`${BASE}/files/move/${fileId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ targetFolderId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al mover archivo');
    return data;
  },

  rename: async (fileId: string, newName: string) => {
    const res = await fetch(`${BASE}/files/rename/${fileId}`, {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ newName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al renombrar');
    return data;
  },

  listTrash: async () => {
    const res = await fetch(`${BASE}/files/trash`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al listar papelera');
    return data;
  },

  restore: async (fileId: string) => {
    const res = await fetch(`${BASE}/files/restore/${fileId}`, {
      method: 'PATCH',
      headers: headers()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al restaurar');
    return data;
  },

  deletePermanent: async (fileId: string) => {
    const res = await fetch(`${BASE}/files/permanent/${fileId}`, {
      method: 'DELETE',
      headers: headers()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al eliminar');
    return data;
  },

  stats: async () => {
    const res = await fetch(`${BASE}/files/storage/stats`, { headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al obtener stats');
    return data;
  }
};

import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Plus, Pencil, Trash2, X, Users as UsersIcon, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api.js';

const RolesPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'CLIENT', is_active: true });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try { 
      const r = await api.get('/users'); 
      setUsers(r.data.users || []); 
    }
    catch { setUsers([]); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => { setEditing(null); setForm({ full_name: '', email: '', role: 'CLIENT', is_active: true }); setError(''); setShowModal(true); };
  const openEdit = (u) => { setEditing(u); setForm({ full_name: u.full_name || '', email: u.email, role: u.role || 'CLIENT', is_active: u.is_active }); setError(''); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    try {
      if (editing) { 
        await api.put(`/users/${editing.id}`, form); 
      }
      else { 
        // Crear usuario por defecto con password (123456)
        await api.post('/auth/register', { ...form, password: 'password123' }); 
      }
      setShowModal(false); fetchUsers();
      Swal.fire({ title: 'Éxito', text: 'Usuario guardado.', icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--bg-primary)', color: 'var(--text-primary)' });
    } catch (err) { setError(err.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción es irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    });
    if (!result.isConfirmed) return;
    try { 
      await api.delete(`/users/${id}`); 
      fetchUsers(); 
      Swal.fire({ title: 'Eliminado', text: 'El usuario ha sido eliminado.', icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--bg-primary)', color: 'var(--text-primary)' });
    }
    catch (err) { Swal.fire({ title: 'Error', text: err.response?.data?.error || 'Error al eliminar', icon: 'error', background: 'var(--bg-primary)', color: 'var(--text-primary)' }); }
  };

  return (
    <DashboardLayout title="Roles y Usuarios" subtitle="Gestión de cuentas y accesos RBAC">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={18}/> Nuevo Usuario</button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['ID', 'Usuario', 'Rol', 'Acceso', 'Registro', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando usuarios...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron usuarios.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.id.substring(0, 8)}...</td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name || 'Sin Nombre'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <span style={{ padding: '0.15rem 0.5rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: u.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.1)' : u.role === 'OPERATOR' ? 'rgba(37,99,235,0.1)' : 'rgba(10,185,129,0.1)', color: u.role === 'SUPER_ADMIN' ? '#ef4444' : u.role === 'OPERATOR' ? '#2563eb' : '#10b981' }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    {u.is_active ? 
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: '0.85rem', fontWeight: 500 }}><CheckCircle size={14}/> Habilitado</span> : 
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 500 }}><XCircle size={14}/> Suspendido</span>
                    }
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.85rem 1.25rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn-ghost" onClick={() => openEdit(u)} style={{ width: 32, height: 32 }}><Pencil size={15}/></button>
                      <button className="btn-ghost" onClick={() => handleDelete(u.id)} style={{ width: 32, height: 32, color: 'var(--danger)' }}><Trash2 size={15}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 440, padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ color: 'var(--text-primary)' }}>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ width: 32, height: 32 }}><X size={18}/></button>
            </div>
            {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.6rem', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}
            
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Nombre Completo</label>
                <input className="input-control" required value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input type="email" className="input-control" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!!editing} />
              </div>
              
              {!editing && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--accent-light)', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  La contraseña por defecto será: <strong>password123</strong> (El usuario deberá cambiarla).
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Rol del Sistema</label>
                <select className="input-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="CLIENT">CLIENTE (Solo ver su portal)</option>
                  <option value="OPERATOR">OPERARIO (Operaciones, ver inventario)</option>
                  <option value="SUPER_ADMIN">SUPER ADMIN (Auditoría, Roles)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.5rem 0' }}>
                <input type="checkbox" id="activeUser" checked={form.is_active} onChange={e => setForm({...form, is_active: e.target.checked})} style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)' }} />
                <label htmlFor="activeUser" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>Acceso Habilitado (Permitir Ingreso)</label>
              </div>

              <button type="submit" className="btn btn-primary w-full">{editing ? 'Guardar Cambios' : 'Crear Usuario'}</button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RolesPage;

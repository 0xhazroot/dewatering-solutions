import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { Plus, Pencil, Trash2, X, Search, ShieldAlert, CheckCircle, XCircle, Lock, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

const RolesPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    password: 'Dewatering@2026', 
    role: 'CLIENT', 
    is_active: true 
  });
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

  const openCreate = () => { 
    setEditing(null); 
    setForm({ 
      full_name: '', 
      email: '', 
      password: 'Dewatering@2026', 
      role: 'CLIENT', 
      is_active: true 
    }); 
    setError(''); 
    setShowPassword(false);
    setShowModal(true); 
  };

  const openEdit = (u) => { 
    setEditing(u); 
    setForm({ 
      full_name: u.full_name || '', 
      email: u.email, 
      password: '', 
      role: u.role || 'CLIENT', 
      is_active: u.is_active 
    }); 
    setError(''); 
    setShowPassword(false);
    setShowModal(true); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setError('');
    try {
      if (editing) { 
        const payload = { 
          full_name: form.full_name, 
          role: form.role, 
          is_active: form.is_active 
        };
        if (form.password && form.password.trim() !== '') {
          payload.password = form.password;
        }
        await api.put(`/users/${editing.id}`, payload); 
      }
      else { 
        const passwordToUse = form.password && form.password.trim() !== '' 
          ? form.password 
          : 'Dewatering@2026';

        await api.post('/auth/register', { 
          full_name: form.full_name,
          email: form.email,
          password: passwordToUse,
          role: form.role,
          is_active: form.is_active
        }); 
      }
      setShowModal(false); 
      fetchUsers();
      Swal.fire({ 
        title: 'Éxito', 
        text: editing ? 'Usuario actualizado correctamente.' : 'Usuario creado exitosamente.', 
        icon: 'success', 
        timer: 1500, 
        showConfirmButton: false, 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)' 
      });
    } catch (err) { 
      setError(err.response?.data?.error || 'Error al guardar el usuario.'); 
    }
  };

  const handleDelete = async (userToDelete) => {
    if (currentUser && (currentUser.id === userToDelete.id || currentUser.email === userToDelete.email)) {
      Swal.fire({
        title: 'Acción bloqueada',
        text: 'Por seguridad, no puedes eliminar tu propia cuenta en sesión activa.',
        icon: 'info',
        confirmButtonColor: '#2563eb'
      });
      return;
    }

    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se eliminará permanentemente la cuenta de ${userToDelete.full_name || userToDelete.email}.`,
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
      await api.delete(`/users/${userToDelete.id}`); 
      fetchUsers(); 
      Swal.fire({ 
        title: 'Eliminado', 
        text: 'El usuario ha sido eliminado correctamente.', 
        icon: 'success', 
        timer: 1500, 
        showConfirmButton: false, 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)' 
      });
    }
    catch (err) { 
      Swal.fire({ 
        title: 'Error', 
        text: err.response?.data?.error || 'Error al eliminar usuario', 
        icon: 'error', 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)' 
      }); 
    }
  };

  const filteredUsers = users.filter(u => 
    (u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Roles y Usuarios" subtitle="Gestión centralizada de cuentas y accesos RBAC">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}/>
          <input 
            className="input-control" 
            placeholder="Buscar por nombre, correo o rol..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
            style={{ paddingLeft: '2.2rem' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {filteredUsers.length} usuario(s)
          </span>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={18}/> Nuevo Usuario</button>
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                {['Usuario', 'Correo', 'Rol del Sistema', 'Acceso', 'Registro', 'Acciones'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Cargando usuarios...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No se encontraron usuarios.</td></tr>
              ) : filteredUsers.map(u => {
                const isSelf = currentUser && (currentUser.id === u.id || currentUser.email === u.email);
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ 
                          width: 34, height: 34, borderRadius: '50%', 
                          background: isSelf ? 'var(--accent-gradient)' : 'var(--border-color)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', 
                          color: isSelf ? '#fff' : 'var(--text-primary)', fontSize: '0.8rem', fontWeight: 700 
                        }}>
                          {(u.full_name || u.email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {u.full_name || 'Sin Nombre'}
                            {isSelf && (
                              <span style={{ fontSize: '0.65rem', backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '0.1rem 0.35rem', borderRadius: 4, fontWeight: 700 }}>
                                Tú
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.company || 'Dewatering Solutions'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {u.email}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <span style={{ 
                        padding: '0.2rem 0.6rem', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 700, 
                        backgroundColor: u.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.1)' : u.role === 'OPERATOR' ? 'rgba(37,99,235,0.1)' : 'rgba(16,185,129,0.1)', 
                        color: u.role === 'SUPER_ADMIN' ? '#ef4444' : u.role === 'OPERATOR' ? '#2563eb' : '#10b981' 
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      {u.is_active ? 
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--success)', fontSize: '0.8rem', fontWeight: 600 }}>
                          <CheckCircle size={14}/> Activo
                        </span> : 
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
                          <XCircle size={14}/> Suspendido
                        </span>
                      }
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        <button className="btn-ghost" title="Editar Usuario" onClick={() => openEdit(u)} style={{ width: 32, height: 32 }}>
                          <Pencil size={15}/>
                        </button>
                        {isSelf ? (
                          <button className="btn-ghost" disabled title="No puedes eliminar tu propia cuenta activa" style={{ width: 32, height: 32, opacity: 0.35, cursor: 'not-allowed' }}>
                            <Lock size={15}/>
                          </button>
                        ) : (
                          <button className="btn-ghost" title="Eliminar Usuario" onClick={() => handleDelete(u)} style={{ width: 32, height: 32, color: 'var(--danger)' }}>
                            <Trash2 size={15}/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={() => setShowModal(false)}>
          <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 460, padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>{editing ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)} style={{ width: 32, height: 32 }}><X size={18}/></button>
            </div>
            
            {error && (
              <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: 8, marginBottom: '1.2rem', fontSize: '0.85rem', borderLeft: '3px solid var(--danger)' }}>
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Nombre Completo</label>
                <input 
                  className="input-control" 
                  required 
                  placeholder="Ej. Luis Ramírez"
                  value={form.full_name} 
                  onChange={e => setForm({...form, full_name: e.target.value})} 
                />
              </div>

              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Correo Electrónico</label>
                <input 
                  type="email" 
                  className="input-control" 
                  required 
                  placeholder="usuario@empresa.com"
                  value={form.email} 
                  onChange={e => setForm({...form, email: e.target.value})} 
                  disabled={!!editing} 
                />
              </div>

              {/* CAMPO DE CONTRASEÑA */}
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    {editing ? 'Nueva Contraseña (Opcional)' : 'Contraseña de Acceso'}
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />} {showPassword ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className="input-control" 
                    required={!editing}
                    placeholder={editing ? 'Dejar en blanco para conservar actual' : 'Ej. Dewatering@2026'}
                    value={form.password} 
                    onChange={e => setForm({...form, password: e.target.value})} 
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.3 }}>
                  🔒 Mínimo 8 caracteres, 1 mayúscula, 1 número y 1 carácter especial (ej. <code>Dewatering@2026</code>).
                </p>
              </div>

              <div className="input-group" style={{ marginBottom: '1.2rem' }}>
                <label className="input-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Rol del Sistema</label>
                <select className="input-control" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="CLIENT">CLIENT (Portal de Proyectos y Cotizaciones)</option>
                  <option value="OPERATOR">OPERATOR (Comercial / CRM / Operaciones)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Control Total / Auditoría / IA)</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', padding: '0.4rem 0' }}>
                <input 
                  type="checkbox" 
                  id="activeUser" 
                  checked={form.is_active} 
                  onChange={e => setForm({...form, is_active: e.target.checked})} 
                  style={{ width: '16px', height: '16px', accentColor: 'var(--accent-primary)', cursor: 'pointer' }} 
                />
                <label htmlFor="activeUser" style={{ fontSize: '0.88rem', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500 }}>
                  Acceso Habilitado (Permitir Ingreso)
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  {editing ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default RolesPage;

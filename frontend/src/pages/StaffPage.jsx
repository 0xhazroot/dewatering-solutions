import React, { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { UserCheck, UserX, Search, ShieldAlert, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api.js';

const StaffPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = async () => {
    try {
      const uRes = await api.get('/users');
      setUsers(uRes.data?.users || uRes.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchData(); }, []);

  const changeUserRole = async (uid, newRole) => {
    try { 
      await api.put(`/users/${uid}`, { role: newRole }); 
      fetchData(); 
      Swal.fire({ title: 'Actualizado', text: 'Rol de usuario actualizado.', icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--bg-primary)', color: 'var(--text-primary)' });
    }
    catch (err) { Swal.fire({ title: 'Error', text: err.response?.data?.error || 'Error al cambiar rol', icon: 'error', background: 'var(--bg-primary)', color: 'var(--text-primary)' }); }
  };

  // FIX: Enviar el booleano correcto (invertir estado actual)
  const toggleStatus = async (uid, currentStatus) => {
    const newStatus = currentStatus === false ? true : false;
    try { 
      await api.patch(`/users/${uid}/status`, { activo: newStatus }); 
      fetchData(); 
      Swal.fire({ title: 'Actualizado', text: 'Estado cambiado correctamente.', icon: 'success', timer: 1500, showConfirmButton: false, background: 'var(--bg-primary)', color: 'var(--text-primary)' });
    }
    catch (err) { Swal.fire({ title: 'Error', text: err.response?.data?.error || 'Error al cambiar estado', icon: 'error', background: 'var(--bg-primary)', color: 'var(--text-primary)' }); }
  };

  const filtered = users.filter(u => (u.email||'').toLowerCase().includes(searchTerm.toLowerCase()) || (u.nombre_completo||'').toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <DashboardLayout title="Personal" subtitle="Gestión de cuentas y roles (RBAC)">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', gap:'1rem', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, maxWidth:360 }}>
          <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-secondary)' }}/>
          <input className="input-control" placeholder="Buscar por nombre o correo..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ paddingLeft:'2.2rem' }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
          <ShieldAlert size={16} color="var(--accent-primary)" />
          <span>{users.filter(u => u.activo !== false).length} activos de {users.length} total</span>
        </div>
      </div>

      <div className="card"><div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr style={{ borderBottom:'1px solid var(--border-color)' }}>
            {['Usuario','Correo','Estado','MFA','Rol Actual','Cambiar Rol','Acción'].map(h=><th key={h} style={{ textAlign:'left', padding:'0.75rem 1.25rem', fontSize:'0.72rem', fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'var(--text-secondary)' }}>Cargando personal...</td></tr>
            : filtered.length===0 ? <tr><td colSpan={7} style={{ padding:'3rem', textAlign:'center', color:'var(--text-secondary)' }}>Sin resultados</td></tr>
            : filtered.map(u=>(
              <tr key={u.id} style={{ borderBottom:'1px solid var(--border-color)', transition:'background 0.15s' }}
                onMouseEnter={e=>e.currentTarget.style.backgroundColor='var(--accent-light)'}
                onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                <td style={{ padding:'0.85rem 1.25rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                    <div style={{ width:34,height:34,borderRadius:'50%',backgroundColor:u.activo!==false?'var(--accent-primary)':'var(--text-secondary)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'0.8rem',fontWeight:600 }}>{(u.nombre_completo||u.email||'?')[0].toUpperCase()}</div>
                    <span style={{ fontWeight:500,color:'var(--text-primary)',fontSize:'0.9rem' }}>{u.nombre_completo||'—'}</span>
                  </div>
                </td>
                <td style={{ padding:'0.85rem 1.25rem',fontSize:'0.85rem',color:'var(--text-secondary)',fontFamily:'monospace' }}>{u.email}</td>
                <td style={{ padding:'0.85rem 1.25rem' }}><span style={{ padding:'0.15rem 0.5rem',borderRadius:'100px',fontSize:'0.72rem',fontWeight:600,backgroundColor:u.activo!==false?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)',color:u.activo!==false?'var(--success)':'var(--danger)' }}>{u.activo!==false?'Activo':'Bloqueado'}</span></td>
                <td style={{ padding:'0.85rem 1.25rem' }}>
                  <span style={{ padding:'0.15rem 0.5rem',borderRadius:'100px',fontSize:'0.72rem',fontWeight:600,
                    backgroundColor: u.mfa_habilitado ? 'rgba(16,185,129,0.1)' : 'rgba(100,100,100,0.08)',
                    color: u.mfa_habilitado ? 'var(--success)' : 'var(--text-secondary)'
                  }}>
                    {u.mfa_habilitado ? '🔐 Activo' : 'Inactivo'}
                  </span>
                </td>
                <td style={{ padding:'0.85rem 1.25rem' }}>
                  <span style={{ 
                    padding:'0.15rem 0.5rem', borderRadius:'100px', fontSize:'0.72rem', fontWeight:600,
                    backgroundColor: u.role === 'SUPER_ADMIN' ? 'rgba(239,68,68,0.1)' : u.role === 'OPERATOR' ? 'rgba(37,99,235,0.1)' : 'rgba(16,185,129,0.1)',
                    color: u.role === 'SUPER_ADMIN' ? '#ef4444' : u.role === 'OPERATOR' ? '#2563eb' : '#10b981'
                  }}>{u.role || 'Sin rol'}</span>
                </td>
                <td style={{ padding:'0.85rem 1.25rem' }}>
                  <select 
                    className="input-control" 
                    style={{ padding:'0.4rem',fontSize:'0.8rem',maxWidth:140 }} 
                    value={u.role || ''} 
                    onChange={e => changeUserRole(u.id, e.target.value)}
                  >
                    <option value="CLIENT">CLIENT</option>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </td>
                <td style={{ padding:'0.85rem 1.25rem' }}>
                  <button className="btn-ghost" onClick={()=>toggleStatus(u.id, u.activo)} 
                    style={{ width:32,height:32,color:u.activo!==false?'var(--danger)':'var(--success)' }}
                    title={u.activo !== false ? 'Bloquear usuario' : 'Activar usuario'}>
                    {u.activo!==false?<UserX size={16}/>:<UserCheck size={16}/>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></div>
    </DashboardLayout>
  );
};
export default StaffPage;

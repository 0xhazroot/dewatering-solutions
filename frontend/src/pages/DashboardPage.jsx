import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { 
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Package, Store, ShieldAlert, Activity, FileText, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import ClientDashboardPage from './client/ClientDashboardPage.jsx';

// === Datos de Fallback (cuando la BD no está conectada) ===
const fallbackAccessData = [
  { hour: '06:00', accesos: 8, bloqueos: 0 }, { hour: '08:00', accesos: 32, bloqueos: 1 },
  { hour: '09:00', accesos: 65, bloqueos: 2 }, { hour: '10:00', accesos: 78, bloqueos: 3 },
  { hour: '11:00', accesos: 52, bloqueos: 1 }, { hour: '12:00', accesos: 45, bloqueos: 5 },
  { hour: '13:00', accesos: 30, bloqueos: 0 }, { hour: '14:00', accesos: 68, bloqueos: 2 },
  { hour: '15:00', accesos: 82, bloqueos: 8 }, { hour: '16:00', accesos: 91, bloqueos: 4 },
  { hour: '17:00', accesos: 55, bloqueos: 1 }, { hour: '18:00', accesos: 24, bloqueos: 0 },
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];

const renderActiveShape = (props) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle); const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos; const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 25) * cos; const my = cy + (outerRadius + 25) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 18; const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--text-primary)" fontSize={18} fontWeight={700}>{value}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-secondary)" fontSize={11}>{payload.name}</text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}/>
      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 12} outerRadius={outerRadius + 16} fill={fill} opacity={0.4}/>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1.5}/>
      <circle cx={sx} cy={sy} r={3} fill={fill}/>
      <text x={ex + (cos >= 0 ? 6 : -6)} y={ey} textAnchor={textAnchor} fill="var(--text-secondary)" fontSize={11} fontWeight={500}>{`${(percent * 100).toFixed(0)}%`}</text>
    </g>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: '0.85rem' }}>
        <p style={{ margin: '0 0 0.4rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.8rem', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {payload.map((entry, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }}></span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{entry.value}</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{entry.name}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const ActionBadge = ({ action }) => {
  const map = { 
    CREATE: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Creación' }, 
    UPDATE: { bg: 'rgba(37,99,235,0.1)', color: '#2563eb', label: 'Edición' }, 
    DELETE: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Eliminación' }, 
    BLOCK: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Bloqueo' },
    ASSIGN_ROLE: { bg: 'rgba(139,92,246,0.1)', color: '#8b5cf6', label: 'Asignación' },
    REVOKE_ROLE: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Revocación' },
    TOGGLE_STATUS: { bg: 'rgba(6,182,212,0.1)', color: '#06b6d4', label: 'Estado' },
  };
  const s = map[action] || { bg: 'rgba(100,100,100,0.08)', color: '#666', label: action };
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '0.2rem 0.55rem', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 600, backgroundColor: s.bg, color: s.color }}><span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: s.color }}></span>{s.label}</span>);
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { primaryRole } = useAuth();
  const [loaded, setLoaded] = useState(false);
  const [activePieIndex, setActivePieIndex] = useState(0);
  const [hoveredKpi, setHoveredKpi] = useState(null);
  const [isLive, setIsLive] = useState(false);

  // Datos reales desde la API
  const [userStats, setUserStats] = useState(null);
  const [productStats, setProductStats] = useState(null);
  const [storeCount, setStoreCount] = useState(0);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStats, setAuditStats] = useState(null);

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);
  const onPieEnter = useCallback((_, index) => setActivePieIndex(index), []);

  // Cargar datos reales de la API
  const loadLiveData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/users'),
        api.get('/products'),
        api.get('/audit')
      ]);

      let isConnected = false;
      if (results[0].status === 'fulfilled') {
        const users = results[0].value.data.users || [];
        setUserStats({ activos: users.length, con_mfa: 0 });
        isConnected = true;
      }
      if (results[1].status === 'fulfilled') {
        const products = results[1].value.data.products || [];
        
        // Calcular categorias manualmente
        const catMap = {};
        products.forEach(p => {
          const c = p.category || 'Otros';
          catMap[c] = (catMap[c] || 0) + 1;
        });
        const byCategory = Object.keys(catMap).map(k => ({ categoria: k, count: catMap[k] }));

        setProductStats({ total: products.length, bajo_stock: 0, byCategory, byStore: [{ sucursal: 'Lima', stock: products.length }] });
        isConnected = true;
      }
      setStoreCount(2); // Hardcoded to 2 since StoresPage uses local state with 2 branches
      
      if (results[2].status === 'fulfilled') {
        const logs = results[2].value.data.logs || results[2].value.data || [];
        setAuditLogs(logs);
        setAuditStats({ total: logs.length, last24h: logs.length });
        isConnected = true;
      }

      setIsLive(isConnected);
    } catch {
      setIsLive(false);
    }
  }, []);

  useEffect(() => { loadLiveData(); }, [loadLiveData]);

  // KPIs dinámicos: usa datos reales si están disponibles, si no usa fallback
  const kpis = [
    { 
      label: 'Usuarios Activos', 
      value: userStats?.activos !== undefined ? userStats.activos.toLocaleString() : '0', 
      change: 'Registrados', 
      up: true, icon: Users, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' 
    },
    { 
      label: 'Ítems Inventario', 
      value: productStats?.total !== undefined ? productStats.total.toLocaleString() : '0',
      change: 'En catálogo', 
      up: true, 
      icon: Package, color: '#10b981', bg: 'rgba(16,185,129,0.08)' 
    },
    { 
      label: 'Sucursales', 
      value: storeCount.toString(), 
      change: 'Activas', up: true, 
      icon: Store, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' 
    },
    { 
      label: 'Eventos Auditoría', 
      value: auditStats?.total !== undefined ? auditStats.total.toLocaleString() : '0', 
      change: 'Registrados', 
      up: false, icon: ShieldAlert, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' 
    },
  ];

  // Datos para gráficos: reales si hay, fallback si no
  const inventoryByCategoryData = productStats?.byCategory?.length > 0
    ? productStats.byCategory.map(c => ({ name: c.categoria, value: c.count }))
    : [{ name: 'Sin datos', value: 1 }];

  const stockByStoreData = productStats?.byStore?.length > 0
    ? productStats.byStore
    : [{ sucursal: 'Sin datos', stock: 0 }];

  // Audit logs para la tabla
  const displayLogs = auditLogs.length > 0 ? auditLogs : [];

  if (primaryRole === 'CLIENT') {
    return <ClientDashboardPage />;
  }

  return (
    <DashboardLayout title="Dashboard" subtitle="Resumen general del sistema">
      {/* Status Indicator */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.78rem' }}>
          <span style={{ 
            width:8, height:8, borderRadius:'50%', 
            backgroundColor: isLive ? '#10b981' : '#f59e0b',
            boxShadow: isLive ? '0 0 8px rgba(16,185,129,0.5)' : 'none',
            animation: isLive ? 'pulse 2s infinite' : 'none'
          }}></span>
          <span style={{ color:'var(--text-secondary)', fontWeight:500 }}>
            {isLive ? 'Conectado a la base de datos — Datos en tiempo real' : 'Modo offline — Conecte PostgreSQL para datos reales'}
          </span>
        </div>
        <button className="btn-ghost" onClick={loadLiveData} style={{ width:32, height:32 }} title="Refrescar datos">
          <RefreshCw size={15}/>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
        {kpis.map((kpi, i) => (
          <div key={i} className={`card stat-card ${loaded ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: `${i * 0.06}s`, cursor: 'default', transform: hoveredKpi === i ? 'translateY(-4px)' : 'translateY(0)', boxShadow: hoveredKpi === i ? `0 8px 25px ${kpi.bg}` : 'var(--shadow-sm)', borderColor: hoveredKpi === i ? kpi.color : 'var(--border-color)', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }}
            onMouseEnter={() => setHoveredKpi(i)} onMouseLeave={() => setHoveredKpi(null)}>
            <div className="stat-icon" style={{ backgroundColor: kpi.bg, transition: 'transform 0.3s ease', transform: hoveredKpi === i ? 'scale(1.1)' : 'scale(1)' }}>
              <kpi.icon size={22} color={kpi.color}/>
            </div>
            <div className="stat-info"><p>{kpi.label}</p><h3>{kpi.value}</h3></div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.8rem', fontWeight: 600, color: kpi.up ? 'var(--success)' : 'var(--danger)' }}>
              {kpi.up ? <TrendingUp size={14}/> : <TrendingDown size={14}/>}{kpi.change}
            </div>
          </div>
        ))}
      </div>



      {/* Pie + Bar */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        <div className={`card ${loaded ? 'animate-fade-in' : ''}`} style={{ animationDelay: '0.35s' }}>
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Distribución de Inventario</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{isLive ? 'Datos reales por categoría' : 'Conecte la BD para datos reales'}</p></div>
          <div className="card-body" style={{ height: 310 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie activeIndex={activePieIndex} activeShape={renderActiveShape} data={inventoryByCategoryData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" onMouseEnter={onPieEnter} animationDuration={1200}>
                {inventoryByCategoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none"/>)}
              </Pie></PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={`card ${loaded ? 'animate-fade-in' : ''}`} style={{ animationDelay: '0.4s' }}>
          <div className="card-header"><h3 style={{ fontSize: '1rem' }}>Stock por Sucursal</h3><p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{isLive ? 'Distribución geográfica ABAC' : 'Conecte la BD para datos reales'}</p></div>
          <div className="card-body" style={{ height: 310, padding: '1rem 0' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockByStoreData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} barSize={45}>
                <defs>
                  <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.7}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5}/>
                <XAxis dataKey="sucursal" tick={{ fill: 'var(--text-secondary)', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} dy={10}/>
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10}/>
                <RechartsTooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}/>
                <Bar name="Unidades" dataKey="stock" fill="url(#colorStock)" radius={[6, 6, 0, 0]} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </DashboardLayout>
  );
};

export default DashboardPage;

import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 4000,
  ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('[Dewatering] ❌ Error en el pool de PostgreSQL:', err.message);
});

// ============================================================================
// MOTOR DE BASE DE DATOS EN MEMORIA (FALLBACK AUTOMÁTICO SI SUPABASE ESTÁ PAUSADO)
// ============================================================================
const adminHashSync = bcrypt.hashSync('Admin@2026', 10);
const clientHashSync = bcrypt.hashSync('Client@2026', 10);

const memStore = {
  users: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      email: 'admin@dewatering.com',
      password_hash: adminHashSync,
      full_name: 'Carlos Mendoza (Admin)',
      phone: '+51 999 111 001',
      company: 'Dewatering Solutions',
      position: 'Gerente General',
      role: 'SUPER_ADMIN',
      is_active: true,
      mfa_enabled: false,
      mfa_secret: null,
      avatar_url: null,
      created_at: new Date('2026-01-15T10:00:00Z'),
      updated_at: new Date('2026-01-15T10:00:00Z')
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      email: 'operador@dewatering.com',
      password_hash: adminHashSync,
      full_name: 'Jorge Ramírez (Ingeniería)',
      phone: '+51 999 111 003',
      company: 'Dewatering Solutions',
      position: 'Ingeniero de Procesos',
      role: 'OPERATOR',
      is_active: true,
      mfa_enabled: false,
      mfa_secret: null,
      avatar_url: null,
      created_at: new Date('2026-01-20T10:00:00Z'),
      updated_at: new Date('2026-01-20T10:00:00Z')
    },
    {
      id: '33333333-3333-4333-8333-333333333333',
      email: 'cliente@empresa.com',
      password_hash: clientHashSync,
      full_name: 'Juan Pérez (Cliente)',
      phone: '+51 999 222 001',
      company: 'Minera Andina SAC',
      position: 'Jefe de Operaciones',
      role: 'CLIENT',
      is_active: true,
      mfa_enabled: false,
      mfa_secret: null,
      avatar_url: null,
      created_at: new Date('2026-02-01T10:00:00Z'),
      updated_at: new Date('2026-02-01T10:00:00Z')
    },
    {
      id: '44444444-4444-4444-8444-444444444444',
      email: 'contacto@minera-andina.com',
      password_hash: clientHashSync,
      full_name: 'Ana Torres',
      phone: '+51 999 222 002',
      company: 'Compañía Minera Antapaccay',
      position: 'Superintendente de Planta',
      role: 'CLIENT',
      is_active: true,
      mfa_enabled: false,
      mfa_secret: null,
      avatar_url: null,
      created_at: new Date('2026-02-05T10:00:00Z'),
      updated_at: new Date('2026-02-05T10:00:00Z')
    }
  ],
  service_categories: [
    { id: 1, name: 'Filtración', slug: 'filtracion', description: 'Ensayos y procesos de filtración industrial para separación sólido-líquido', icon: 'Filter', sort_order: 1, is_active: true },
    { id: 2, name: 'Espesamiento', slug: 'espesamiento', description: 'Procesos de espesamiento para concentración de pulpas y relaves', icon: 'Layers', sort_order: 2, is_active: true },
    { id: 3, name: 'Flotación', slug: 'flotacion', description: 'Ensayos de flotación para recuperación de minerales valiosos', icon: 'Waves', sort_order: 3, is_active: true },
    { id: 4, name: 'Lixiviación', slug: 'lixiviacion', description: 'Procesos de lixiviación para extracción de metales', icon: 'Droplets', sort_order: 4, is_active: true },
    { id: 5, name: 'Pilotaje', slug: 'pilotaje', description: 'Pruebas piloto a escala semi-industrial en campo', icon: 'FlaskConical', sort_order: 5, is_active: true },
    { id: 6, name: 'Montaje', slug: 'montaje', description: 'Instalación y montaje de equipos industriales', icon: 'Wrench', sort_order: 6, is_active: true }
  ],
  services: [
    { id: 1, category_id: 1, category_name: 'Filtración', name: 'Ensayo de Filtración al Vacío', slug: 'ensayo-filtracion-vacio', short_description: 'Determinación de parámetros de filtración con equipo de vacío a escala laboratorio', is_featured: true, is_active: true, sort_order: 1 },
    { id: 2, category_id: 1, category_name: 'Filtración', name: 'Ensayo de Filtración a Presión', slug: 'ensayo-filtracion-presion', short_description: 'Pruebas con filtro prensa a escala banco para determinar ciclos óptimos y humedad residual', is_featured: true, is_active: true, sort_order: 2 },
    { id: 3, category_id: 1, category_name: 'Filtración', name: 'Selección de Telas Filtrantes', slug: 'seleccion-telas', short_description: 'Evaluación de permeabilidad y selección de medios filtrantes para cada aplicación', is_featured: false, is_active: true, sort_order: 3 },
    { id: 4, category_id: 2, category_name: 'Espesamiento', name: 'Ensayo de Espesamiento Estático', slug: 'espesamiento-estatico', short_description: 'Pruebas de sedimentación y selección de floculantes para relaves y concentrados', is_featured: true, is_active: true, sort_order: 1 },
    { id: 5, category_id: 2, category_name: 'Espesamiento', name: 'Ensayo de Espesamiento Dinámico', slug: 'espesamiento-dinamico', short_description: 'Simulación continua de espesadores High-Rate a escala piloto', is_featured: false, is_active: true, sort_order: 2 },
    { id: 6, category_id: 5, category_name: 'Pilotaje', name: 'Pilotaje de Filtración en Planta', slug: 'pilotaje-filtracion', short_description: 'Operación de unidad móvil de filtro prensa piloto directamente en la unidad minera', is_featured: true, is_active: true, sort_order: 1 },
    { id: 7, category_id: 6, category_name: 'Montaje', name: 'Montaje de Filtros Prensa y Espesadores', slug: 'montaje-filtros', short_description: 'Instalación electromecánica completa y puesta en marcha bajo norma ISO 9001', is_featured: false, is_active: true, sort_order: 1 }
  ],
  products: [
    { id: 1, name: 'Filtro Prensa Automático FPA-1500', slug: 'filtro-prensa-fpa-1500', category: 'Filtros Prensa', short_description: 'Filtro prensa de placas con sistema automático de descarga y lavado de telas', origin: 'Italia', specifications: { capacidad: '50 m³/h', presion_max: '16 bar', area_filtracion: '200 m²', placas: 80 }, is_active: true, sort_order: 1 },
    { id: 2, name: 'Filtro Prensa Manual FPM-800', slug: 'filtro-prensa-fpm-800', category: 'Filtros Prensa', short_description: 'Filtro prensa manual para operaciones de menor escala y plantas piloto', origin: 'Italia', specifications: { capacidad: '15 m³/h', presion_max: '12 bar', area_filtracion: '60 m²', placas: 30 }, is_active: true, sort_order: 2 },
    { id: 3, name: 'Bomba de Alimentación BA-200', slug: 'bomba-alimentacion-ba-200', category: 'Bombas', short_description: 'Bomba centrífuga de alta resistencia para alimentación de filtros prensa', origin: 'Sudáfrica', specifications: { caudal_max: '200 m³/h', presion_max: '10 bar', potencia: '75 kW' }, is_active: true, sort_order: 3 },
    { id: 4, name: 'Espesador de Alta Capacidad EAC-20', slug: 'espesador-eac-20', category: 'Espesadores', short_description: 'Espesador de 20m de diámetro para alta capacidad en relaves mineros', origin: 'Italia', specifications: { diametro: '20 m', capacidad: '500 TPD', tipo: 'Alta capacidad' }, is_active: true, sort_order: 4 },
    { id: 5, name: 'Decanter Centrífugo DC-450', slug: 'decanter-dc-450', category: 'Decanters', short_description: 'Centrífuga decanter horizontal para deshidratación continua de lodos', origin: 'Italia', specifications: { capacidad: '45 m³/h', velocidad: '3200 RPM', potencia: '55 kW' }, is_active: true, sort_order: 5 },
    { id: 6, name: 'Bomba de Diafragma BD-100', slug: 'bomba-diafragma-bd-100', category: 'Bombas', short_description: 'Bomba neumática de doble diafragma para pulpas densas y abrasivas', origin: 'Sudáfrica', specifications: { caudal_max: '100 m³/h', solidos_max: '70%', presion_max: '8 bar' }, is_active: true, sort_order: 6 }
  ],
  leads: [
    { id: 1, contact_name: 'Roberto Silva', contact_email: 'rsilva@minerasur.com', contact_phone: '+51 999 333 001', company_name: 'Minera Sur SAC', company_sector: 'Minería', source: 'WEB', service_interest: 'Filtración', message: 'Necesitamos evaluar filtros prensa FPA-1500 para nuestra planta de relaves (50 m³/h).', status: 'NEW', priority: 'HIGH', assigned_to: '11111111-1111-4111-8111-111111111111', assigned_name: 'Carlos Mendoza (Admin)', created_at: new Date('2026-10-25T14:00:00Z'), updated_at: new Date('2026-10-25T14:00:00Z') },
    { id: 2, contact_name: 'Patricia Vargas', contact_email: 'pvargas@cementos-peru.com', contact_phone: '+51 999 333 002', company_name: 'Cementos Perú', company_sector: 'Industrial', source: 'REFERRAL', service_interest: 'Espesamiento', message: 'Consulta sobre espesadores EAC-20 para nuestra línea de producción.', status: 'CONTACTED', priority: 'MEDIUM', assigned_to: '11111111-1111-4111-8111-111111111111', assigned_name: 'Carlos Mendoza (Admin)', created_at: new Date('2026-10-27T09:30:00Z'), updated_at: new Date('2026-10-27T09:30:00Z') },
    { id: 3, contact_name: 'Luis Quispe', contact_email: 'lquispe@goldmining.com', contact_phone: '+51 999 333 003', company_name: 'Gold Mining Corp', company_sector: 'Minería', source: 'EVENT', service_interest: 'Pilotaje', message: 'Interesados en pilotaje de filtración a presión para proyecto aurífero.', status: 'PROPOSAL', priority: 'URGENT', assigned_to: '11111111-1111-4111-8111-111111111111', assigned_name: 'Carlos Mendoza (Admin)', created_at: new Date('2026-10-29T16:15:00Z'), updated_at: new Date('2026-10-29T16:15:00Z') },
    { id: 4, contact_name: 'Juan Pérez', contact_email: 'cliente@empresa.com', contact_phone: '+51 999 222 001', company_name: 'Minera Andina SAC', company_sector: 'Minería', source: 'WEB', service_interest: 'Filtración y Montaje', message: 'Adquisición e instalación de Filtro Prensa FPA-1500 + Bomba BA-200.', status: 'WON', priority: 'HIGH', assigned_to: '11111111-1111-4111-8111-111111111111', assigned_name: 'Carlos Mendoza (Admin)', created_at: new Date('2026-10-15T11:00:00Z'), updated_at: new Date('2026-10-20T11:00:00Z') }
  ],
  quotations: [
    {
      id: 1,
      lead_id: 4,
      lead_name: 'Juan Pérez',
      lead_company: 'Minera Andina SAC',
      quotation_number: 'COT-2026-0001',
      version: 1,
      title: 'Suministro y Montaje Filtro Prensa Automático FPA-1500',
      description: 'Incluye Filtro Prensa FPA-1500 (Italia, 80 placas, 16 bar), Bomba Centrífuga BA-200 y puesta en marcha en planta.',
      items: [{ description: 'Filtro Prensa Automático FPA-1500', quantity: 1, unit_price: 85000 }, { description: 'Bomba BA-200 + Comisionamiento', quantity: 1, unit_price: 15000 }],
      subtotal: 100000.00,
      tax: 18000.00,
      total: 118000.00,
      currency: 'USD',
      valid_until: new Date('2026-12-31T00:00:00Z'),
      status: 'APPROVED',
      created_by: '11111111-1111-4111-8111-111111111111',
      created_by_name: 'Carlos Mendoza (Admin)',
      created_at: new Date('2026-10-18T10:00:00Z'),
      updated_at: new Date('2026-10-20T10:00:00Z')
    },
    {
      id: 2,
      lead_id: 3,
      lead_name: 'Luis Quispe',
      lead_company: 'Gold Mining Corp',
      quotation_number: 'COT-2026-0002',
      version: 1,
      title: 'Servicio de Pilotaje de Filtración a Presión In-Situ (30 días)',
      description: 'Despliegue de unidad móvil piloto de filtración prensa con ingenieros de proceso en unidad minera.',
      items: [{ description: 'Alquiler y Operación Planta Piloto Filtración', quantity: 1, unit_price: 25000 }],
      subtotal: 25000.00,
      tax: 4500.00,
      total: 29500.00,
      currency: 'USD',
      valid_until: new Date('2026-12-15T00:00:00Z'),
      status: 'SENT',
      created_by: '11111111-1111-4111-8111-111111111111',
      created_by_name: 'Carlos Mendoza (Admin)',
      created_at: new Date('2026-10-30T15:00:00Z'),
      updated_at: new Date('2026-10-30T15:00:00Z')
    }
  ],
  projects: [
    {
      id: 1,
      quotation_id: 1,
      client_id: '33333333-3333-4333-8333-333333333333',
      client_name: 'Juan Pérez (Cliente)',
      client_company: 'Minera Andina SAC',
      project_number: 'PRJ-2026-0001',
      title: 'Implementación Circuito de Deshidratación de Relaves FPA-1500',
      description: 'Montaje electromecánico, pruebas hidráulicas a 16 bar y capacitación operativa en Minera Andina SAC.',
      status: 'IN_PROGRESS',
      start_date: '2026-10-22',
      end_date: '2026-12-15',
      assigned_engineer: '22222222-2222-4222-8222-222222222222',
      engineer_name: 'Jorge Ramírez (Ingeniería)',
      created_at: new Date('2026-10-22T09:00:00Z'),
      updated_at: new Date('2026-10-31T09:00:00Z')
    }
  ],
  documents: [
    {
      id: 1,
      title: 'Manual Técnico Filtro Prensa Automático FPA-1500 (Italia)',
      description: 'Conocimiento inyectado vía panel de entrenamiento IA',
      category: 'RAG_KNOWLEDGE',
      file_url: 'TEXT_INPUT',
      file_size: 245000,
      file_type: 'pdf',
      is_public: true,
      project_id: 1,
      product_id: 1,
      uploaded_by: '11111111-1111-4111-8111-111111111111',
      uploaded_by_name: 'Carlos Mendoza (Admin)',
      download_count: 14,
      created_at: new Date('2026-10-25T12:00:00Z')
    },
    {
      id: 2,
      title: 'Certificado de Calidad ISO 9001 y Protocolo de Pruebas Hidrostáticas',
      description: 'Dossier de calidad para cliente Minera Andina SAC',
      category: 'CERTIFICATE',
      file_url: '/logodewatering.png',
      file_size: 512000,
      file_type: 'pdf',
      is_public: true,
      project_id: 1,
      product_id: 1,
      uploaded_by: '11111111-1111-4111-8111-111111111111',
      uploaded_by_name: 'Carlos Mendoza (Admin)',
      download_count: 8,
      created_at: new Date('2026-10-28T10:00:00Z')
    }
  ],
  document_embeddings: [
    {
      id: 1,
      document_id: 1,
      chunk_index: 0,
      chunk_text: 'El Filtro Prensa Automático FPA-1500 de Dewatering Solutions (origen Italia) opera a una presión máxima de trabajo de 16 bar, cuenta con 80 placas de polipropileno de alta densidad (1500x1500 mm), un área de filtración de 200 m² y una capacidad nominal de 50 m³/h. Permite obtener queques minerales con humedad residual menor al 14% y recuperación de agua clarificada superior al 88%.',
      metadata: { source: 'Manual Técnico Filtro Prensa Automático FPA-1500 (Italia)' },
      created_at: new Date('2026-10-25T12:00:00Z')
    },
    {
      id: 2,
      document_id: 1,
      chunk_index: 1,
      chunk_text: 'Para el bombeo de alimentación al filtro prensa FPA-1500 se recomienda la Bomba Centrífuga BA-200 (origen Sudáfrica, 200 m³/h, 10 bar, motor de 75 kW) o la Bomba Neumática de Diafragma BD-100 para pulpas con hasta 70% de sólidos en peso.',
      metadata: { source: 'Manual Técnico Filtro Prensa Automático FPA-1500 (Italia)' },
      created_at: new Date('2026-10-25T12:00:00Z')
    }
  ],
  ai_training_jobs: [
    {
      id: 1,
      file_name: 'Manual_FPA_1500_Italia.pdf',
      file_url: 'local_upload://Manual_FPA_1500_Italia.pdf',
      status: 'COMPLETED',
      progress: 100,
      error_message: null,
      created_at: new Date('2026-10-25T12:00:00Z'),
      completed_at: new Date('2026-10-25T12:00:15Z')
    }
  ],
  stores: [
    { id: 1, nombre: 'Sede Central y Laboratorio Metalúrgico — Lima', ubicacion: 'Av. Industrial 123, Ate, Lima - Perú', image_url: '/images/sucursal-lima.webp', created_at: new Date() },
    { id: 2, nombre: 'Planta de Ensamblaje y Almacén — Callao', ubicacion: 'Av. Néstor Gambetta, Callao - Perú', image_url: '/images/sucursal-callao.webp', created_at: new Date() }
  ],
  audit_logs: [
    {
      id: 1,
      user_id: '11111111-1111-4111-8111-111111111111',
      user_email: 'admin@dewatering.com',
      user_name: 'Carlos Mendoza (Admin)',
      action: 'CREATE',
      entity: 'QUOTATION',
      entity_id: '1',
      old_data: null,
      new_data: { quotation_number: 'COT-2026-0001', total: 118000, currency: 'USD', status: 'APPROVED' },
      ip_address: '127.0.0.1',
      created_at: new Date('2026-10-20T10:00:00Z')
    },
    {
      id: 2,
      user_id: '11111111-1111-4111-8111-111111111111',
      user_email: 'admin@dewatering.com',
      user_name: 'Carlos Mendoza (Admin)',
      action: 'UPDATE_STATUS',
      entity: 'LEAD',
      entity_id: '4',
      old_data: { status: 'PROPOSAL' },
      new_data: { status: 'WON' },
      ip_address: '127.0.0.1',
      created_at: new Date('2026-10-20T11:00:00Z')
    }
  ]
};

function executeInMemoryQuery(text, params = []) {
  const sql = text.replace(/\s+/g, ' ').trim();
  const upper = sql.toUpperCase();

  if (upper.startsWith('SELECT NOW()')) {
    return { rows: [{ server_time: new Date() }], rowCount: 1 };
  }
  if (upper.startsWith('ALTER TABLE')) {
    return { rows: [], rowCount: 0 };
  }

  // ==================== USERS ====================
  if (upper.includes('FROM USERS WHERE EMAIL = $1')) {
    const email = (params[0] || '').toLowerCase();
    const user = memStore.users.find(u => u.email.toLowerCase() === email);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }
  if (upper.includes('SELECT MFA_SECRET FROM USERS WHERE ID = $1')) {
    const user = memStore.users.find(u => String(u.id) === String(params[0]));
    return { rows: user ? [{ mfa_secret: user.mfa_secret }] : [], rowCount: user ? 1 : 0 };
  }
  if (upper.includes('FROM USERS WHERE ID = $1')) {
    const user = memStore.users.find(u => String(u.id) === String(params[0]));
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }
  if (upper.includes('COUNT(*)::INT AS TOTAL') && upper.includes('FROM USERS')) {
    return {
      rows: [{
        total: memStore.users.length,
        activos: memStore.users.filter(u => u.is_active).length,
        inactivos: memStore.users.filter(u => !u.is_active).length,
        clientes: memStore.users.filter(u => u.role === 'CLIENT').length,
        admins: memStore.users.filter(u => u.role === 'SUPER_ADMIN').length
      }],
      rowCount: 1
    };
  }
  if (upper.includes('FROM USERS WHERE 1=1')) {
    return { rows: [...memStore.users], rowCount: memStore.users.length };
  }
  if (upper.startsWith('INSERT INTO USERS')) {
    const newUser = {
      id: `user-${Date.now()}`,
      email: params[0],
      password_hash: params[1],
      full_name: params[2],
      phone: params[3],
      company: params[4],
      position: params[5],
      role: params[6] || 'CLIENT',
      is_active: params[7] !== undefined ? params[7] : true,
      mfa_enabled: false,
      created_at: new Date(),
      updated_at: new Date()
    };
    memStore.users.unshift(newUser);
    return { rows: [newUser], rowCount: 1 };
  }
  if (upper.startsWith('UPDATE USERS SET')) {
    const id = params[params.length - 1];
    const user = memStore.users.find(u => String(u.id) === String(id));
    if (user) {
      if (upper.includes('IS_ACTIVE = $1') && params.length === 2) user.is_active = params[0];
      if (upper.includes('ROLE = $1')) user.role = params[0];
      user.updated_at = new Date();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (upper.startsWith('DELETE FROM USERS')) {
    const idx = memStore.users.findIndex(u => String(u.id) === String(params[0]));
    if (idx >= 0) {
      const removed = memStore.users.splice(idx, 1)[0];
      return { rows: [removed], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // ==================== LEADS ====================
  if (upper.includes('COUNT(*)::INT AS TOTAL') && upper.includes('FROM LEADS')) {
    return {
      rows: [{
        total: memStore.leads.length,
        nuevos: memStore.leads.filter(l => l.status === 'NEW').length,
        contactados: memStore.leads.filter(l => l.status === 'CONTACTED').length,
        propuesta: memStore.leads.filter(l => l.status === 'PROPOSAL').length,
        ganados: memStore.leads.filter(l => l.status === 'WON').length,
        perdidos: memStore.leads.filter(l => l.status === 'LOST').length,
        urgentes: memStore.leads.filter(l => l.priority === 'URGENT').length
      }],
      rowCount: 1
    };
  }
  if (upper.includes('GROUP BY STATUS') && upper.includes('FROM LEADS')) {
    const counts = {};
    memStore.leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });
    const rows = Object.entries(counts).map(([status, count]) => ({ status, count }));
    return { rows, rowCount: rows.length };
  }
  if (upper.includes('FROM LEADS L') && upper.includes('WHERE L.ID = $1')) {
    const lead = memStore.leads.find(l => Number(l.id) === Number(params[0]));
    return { rows: lead ? [lead] : [], rowCount: lead ? 1 : 0 };
  }
  if (upper.includes('FROM LEADS L')) {
    return { rows: [...memStore.leads], rowCount: memStore.leads.length };
  }
  if (upper.startsWith('INSERT INTO LEADS')) {
    const newLead = {
      id: memStore.leads.length + 1,
      contact_name: params[0],
      contact_email: params[1],
      contact_phone: params[2],
      company_name: params[3],
      company_sector: params[4],
      source: params[5] || 'WEB',
      service_interest: params[6],
      message: params[7],
      priority: params[8] || 'MEDIUM',
      status: 'NEW',
      created_at: new Date(),
      updated_at: new Date()
    };
    memStore.leads.unshift(newLead);
    return { rows: [newLead], rowCount: 1 };
  }
  if (upper.startsWith('UPDATE LEADS SET')) {
    const id = params[params.length - 1];
    const lead = memStore.leads.find(l => Number(l.id) === Number(id));
    if (lead) {
      if (upper.includes('STATUS = $1')) lead.status = params[0];
      lead.updated_at = new Date();
      return { rows: [lead], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (upper.startsWith('DELETE FROM LEADS')) {
    const idx = memStore.leads.findIndex(l => Number(l.id) === Number(params[0]));
    if (idx >= 0) return { rows: [memStore.leads.splice(idx, 1)[0]], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  }

  // ==================== QUOTATIONS ====================
  if (upper.includes('SELECT COUNT(*)::INT AS COUNT FROM QUOTATIONS WHERE QUOTATION_NUMBER LIKE')) {
    return { rows: [{ count: memStore.quotations.length }], rowCount: 1 };
  }
  if (upper.includes('COUNT(*)::INT AS TOTAL') && upper.includes('FROM QUOTATIONS')) {
    const approvedSum = memStore.quotations
      .filter(q => q.status === 'APPROVED')
      .reduce((acc, q) => acc + Number(q.total || 0), 0);
    return {
      rows: [{
        total: memStore.quotations.length,
        borradores: memStore.quotations.filter(q => q.status === 'DRAFT').length,
        enviadas: memStore.quotations.filter(q => q.status === 'SENT').length,
        aprobadas: memStore.quotations.filter(q => q.status === 'APPROVED').length,
        rechazadas: memStore.quotations.filter(q => q.status === 'REJECTED').length,
        monto_aprobado: approvedSum
      }],
      rowCount: 1
    };
  }
  if (upper.includes('FROM QUOTATIONS Q') && upper.includes('WHERE Q.ID = $1')) {
    const q = memStore.quotations.find(item => Number(item.id) === Number(params[0]));
    return { rows: q ? [q] : [], rowCount: q ? 1 : 0 };
  }
  if (upper.includes('FROM QUOTATIONS Q')) {
    return { rows: [...memStore.quotations], rowCount: memStore.quotations.length };
  }
  if (upper.startsWith('INSERT INTO QUOTATIONS')) {
    const lead = memStore.leads.find(l => Number(l.id) === Number(params[0]));
    const newQ = {
      id: memStore.quotations.length + 1,
      lead_id: params[0],
      lead_name: lead?.contact_name || 'Cliente Corporativo',
      lead_company: lead?.company_name || 'Minería Perú',
      quotation_number: params[1],
      title: params[2],
      description: params[3],
      items: typeof params[4] === 'string' ? JSON.parse(params[4]) : (params[4] || []),
      subtotal: Number(params[5] || 0),
      tax: Number(params[6] || 0),
      total: Number(params[7] || 0),
      currency: params[8] || 'USD',
      valid_until: params[9] || new Date(Date.now() + 30 * 86400000),
      status: 'SENT',
      created_by: params[10],
      created_by_name: 'Carlos Mendoza (Admin)',
      created_at: new Date(),
      updated_at: new Date()
    };
    memStore.quotations.unshift(newQ);
    return { rows: [newQ], rowCount: 1 };
  }
  if (upper.startsWith('UPDATE QUOTATIONS SET')) {
    const id = params[params.length - 1];
    const q = memStore.quotations.find(item => Number(item.id) === Number(id));
    if (q) {
      if (upper.includes('STATUS = $1')) q.status = params[0];
      q.updated_at = new Date();
      return { rows: [q], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // ==================== PROJECTS ====================
  if (upper.includes('COUNT(*)::INT AS TOTAL') && upper.includes('FROM PROJECTS')) {
    return {
      rows: [{
        total: memStore.projects.length,
        planificados: memStore.projects.filter(p => p.status === 'PLANNING').length,
        en_progreso: memStore.projects.filter(p => p.status === 'IN_PROGRESS').length,
        completados: memStore.projects.filter(p => p.status === 'COMPLETED').length
      }],
      rowCount: 1
    };
  }
  if (upper.includes('FROM PROJECTS P')) {
    return { rows: [...memStore.projects], rowCount: memStore.projects.length };
  }

  // ==================== PRODUCTS & SERVICES ====================
  if (upper.startsWith('INSERT INTO PRODUCTS')) {
    const newProd = {
      id: memStore.products.length + 1,
      name: params[0],
      slug: params[1] || `prod-${Date.now()}`,
      category: params[2] || 'Equipos',
      short_description: params[3] || '',
      full_description: params[4] || '',
      specifications: typeof params[5] === 'string' ? JSON.parse(params[5]) : (params[5] || {}),
      origin: params[6] || 'Italia',
      image_urls: params[7] || [],
      datasheet_url: params[8] || null,
      sort_order: params[9] || 0,
      is_active: true,
      created_at: new Date()
    };
    memStore.products.push(newProd);
    return { rows: [newProd], rowCount: 1 };
  }
  if (upper.startsWith('UPDATE PRODUCTS SET')) {
    const id = params[params.length - 1];
    const prod = memStore.products.find(p => Number(p.id) === Number(id));
    if (prod) {
      if (params[0]) prod.name = params[0];
      if (params[1]) prod.slug = params[1];
      if (params[2]) prod.category = params[2];
      if (params[3]) prod.short_description = params[3];
      if (params[4]) prod.origin = params[4];
      return { rows: [prod], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }
  if (upper.startsWith('DELETE FROM PRODUCTS')) {
    const idx = memStore.products.findIndex(p => Number(p.id) === Number(params[0]));
    if (idx >= 0) return { rows: [memStore.products.splice(idx, 1)[0]], rowCount: 1 };
    return { rows: [], rowCount: 0 };
  }
  if (upper.includes('FROM PRODUCTS WHERE ID = $1')) {
    const prod = memStore.products.find(p => Number(p.id) === Number(params[0]));
    return { rows: prod ? [prod] : [], rowCount: prod ? 1 : 0 };
  }
  if (upper.includes('SELECT DISTINCT CATEGORY FROM PRODUCTS')) {
    const cats = [...new Set(memStore.products.map(p => p.category))].map(category => ({ category }));
    return { rows: cats, rowCount: cats.length };
  }
  if (upper.includes('FROM PRODUCTS')) {
    return { rows: [...memStore.products], rowCount: memStore.products.length };
  }
  if (upper.includes('FROM SERVICE_CATEGORIES')) {
    return { rows: [...memStore.service_categories], rowCount: memStore.service_categories.length };
  }
  if (upper.includes('FROM SERVICES')) {
    return { rows: [...memStore.services], rowCount: memStore.services.length };
  }

  // ==================== STORES ====================
  if (upper.includes('FROM STORES')) {
    return { rows: [...memStore.stores], rowCount: memStore.stores.length };
  }

  // ==================== DOCUMENTS & RAG TRAINING ====================
  if (upper.includes("WHERE CATEGORY = 'RAG_KNOWLEDGE'")) {
    const ragDocs = memStore.documents
      .filter(d => d.category === 'RAG_KNOWLEDGE')
      .map(d => ({
        id: d.id,
        name: d.title,
        date: d.created_at,
        chunks: memStore.document_embeddings.filter(e => Number(e.document_id) === Number(d.id)).length || 1
      }));
    return { rows: ragDocs, rowCount: ragDocs.length };
  }
  if (upper.startsWith('INSERT INTO DOCUMENTS')) {
    const newDoc = {
      id: memStore.documents.length + 1,
      title: params[0],
      description: params[1],
      category: upper.includes("'RAG_KNOWLEDGE'") ? 'RAG_KNOWLEDGE' : (params[2] || 'OTHER'),
      file_url: upper.includes("'RAG_KNOWLEDGE'") ? 'TEXT_INPUT' : (params[3] || ''),
      is_public: true,
      uploaded_by: params[params.length - 1],
      created_at: new Date()
    };
    memStore.documents.unshift(newDoc);
    return { rows: [newDoc], rowCount: 1 };
  }
  if (upper.includes('FROM DOCUMENTS')) {
    return { rows: [...memStore.documents], rowCount: memStore.documents.length };
  }
  if (upper.startsWith('DELETE FROM DOCUMENTS')) {
    const idx = memStore.documents.findIndex(d => Number(d.id) === Number(params[0]));
    if (idx >= 0) memStore.documents.splice(idx, 1);
    return { rows: [], rowCount: 1 };
  }

  if (upper.startsWith('INSERT INTO DOCUMENT_EMBEDDINGS')) {
    const newEmb = {
      id: memStore.document_embeddings.length + 1,
      document_id: params[0],
      chunk_index: params[1],
      chunk_text: params[2],
      metadata: typeof params[4] === 'string' ? JSON.parse(params[4]) : (params[4] || { source: 'Entrenamiento IA' }),
      created_at: new Date()
    };
    memStore.document_embeddings.unshift(newEmb);
    return { rows: [newEmb], rowCount: 1 };
  }
  if (upper.startsWith('DELETE FROM DOCUMENT_EMBEDDINGS')) {
    memStore.document_embeddings = memStore.document_embeddings.filter(e => Number(e.document_id) !== Number(params[0]));
    return { rows: [], rowCount: 1 };
  }
  if (upper.includes('FROM DOCUMENT_EMBEDDINGS')) {
    const rows = memStore.document_embeddings.map(e => ({
      ...e,
      similarity: 0.85
    }));
    return { rows, rowCount: rows.length };
  }

  // ==================== AI TRAINING JOBS ====================
  if (upper.startsWith('INSERT INTO AI_TRAINING_JOBS')) {
    const job = {
      id: memStore.ai_training_jobs.length + 1,
      file_name: params[0],
      file_url: params[1],
      status: 'PENDING',
      progress: 0,
      error_message: null,
      created_at: new Date()
    };
    memStore.ai_training_jobs.unshift(job);
    return { rows: [job], rowCount: 1 };
  }
  if (upper.startsWith('UPDATE AI_TRAINING_JOBS')) {
    const id = params[params.length - 1];
    const job = memStore.ai_training_jobs.find(j => Number(j.id) === Number(id));
    if (job) {
      if (upper.includes("STATUS = 'EXTRACTING'")) { job.status = 'EXTRACTING'; job.progress = 10; }
      else if (upper.includes("STATUS = 'EMBEDDING'")) { job.status = 'EMBEDDING'; job.progress = 40; }
      else if (upper.includes("STATUS = 'COMPLETED'")) { job.status = 'COMPLETED'; job.progress = 100; job.completed_at = new Date(); }
      else if (upper.includes("STATUS = 'FAILED'")) { job.status = 'FAILED'; job.error_message = params[0]; }
      else if (upper.includes('PROGRESS = $1')) { job.progress = params[0]; }
    }
    return { rows: job ? [job] : [], rowCount: 1 };
  }
  if (upper.startsWith('DELETE FROM AI_TRAINING_JOBS')) {
    memStore.ai_training_jobs = memStore.ai_training_jobs.filter(j => Number(j.id) !== Number(params[0]));
    return { rows: [], rowCount: 1 };
  }
  if (upper.includes('FROM AI_TRAINING_JOBS')) {
    return { rows: [...memStore.ai_training_jobs], rowCount: memStore.ai_training_jobs.length };
  }

  // ==================== AUDIT LOGS ====================
  if (upper.startsWith('INSERT INTO AUDIT_LOGS')) {
    const log = {
      id: memStore.audit_logs.length + 1,
      user_id: params[0],
      user_email: 'admin@dewatering.com',
      user_name: 'Carlos Mendoza (Admin)',
      action: params[1],
      entity: params[2],
      entity_id: params[3],
      old_data: params[4] ? JSON.parse(params[4]) : null,
      new_data: params[5] ? JSON.parse(params[5]) : null,
      ip_address: params[6] || '127.0.0.1',
      created_at: new Date()
    };
    memStore.audit_logs.unshift(log);
    return { rows: [log], rowCount: 1 };
  }
  if (upper.includes('GROUP BY ACTION') && upper.includes('FROM AUDIT_LOGS')) {
    return { rows: [{ action: 'CREATE', count: 5 }, { action: 'UPDATE_STATUS', count: 3 }], rowCount: 2 };
  }
  if (upper.includes('COUNT(*)::INT') && upper.includes('FROM AUDIT_LOGS')) {
    return { rows: [{ total: memStore.audit_logs.length, count: memStore.audit_logs.length }], rowCount: 1 };
  }
  if (upper.includes('FROM AUDIT_LOGS')) {
    return { rows: [...memStore.audit_logs], rowCount: memStore.audit_logs.length };
  }

  return { rows: [], rowCount: 0 };
}

let useInMemoryFallback = false;

export const query = async (text, params) => {
  if (!useInMemoryFallback) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (
        err.message?.includes('not found') ||
        err.code === 'ENOTFOUND' ||
        err.code === 'ETIMEDOUT' ||
        err.code === 'ECONNREFUSED' ||
        err.code === 'EACCES' ||
        err.name === 'AggregateError' ||
        err.code === 'XX000'
      ) {
        console.warn('[Dewatering] ⚡ Supabase en pausa/offline -> Activando Base de Datos en Memoria Local con datos Demo completos.');
        useInMemoryFallback = true;
      } else {
        throw err;
      }
    }
  }
  return executeInMemoryQuery(text, params);
};

export default pool;

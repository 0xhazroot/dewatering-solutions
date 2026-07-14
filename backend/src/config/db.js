import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Configuración del Pool de conexiones para maximizar rendimiento
const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20, // Máximo de clientes en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: isProduction ? { rejectUnauthorized: true } : { rejectUnauthorized: false },
});

pool.on('connect', () => {
  // console.log('[Dewatering] 📦 Conexión temporal establecida (pool)');
});

pool.on('error', (err) => {
  console.error('[Dewatering] ❌ Error inesperado en el pool de PostgreSQL:', err.message);
  // process.exit(-1); // Comentado para evitar que tumbe el servidor en redes restringidas
});

// Función wrapper para queries seguras
export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  // Descomentar para debug de consultas lentas
  // console.log(`[DB] Executed query: { text: ${text}, duration: ${duration}ms, rows: ${res.rowCount} }`);
  return res;
};

export default pool;

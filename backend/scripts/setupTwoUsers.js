import pool from '../src/config/db.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

async function resetAndSeed() {
  const client = await pool.connect();
  try {
    console.log('[Dewatering] 🧹 Limpiando usuarios y tablas dependientes...');

    // Truncate users and dependent tables (leads, quotations, projects, documents, etc.)
    await client.query('TRUNCATE TABLE users CASCADE;');
    console.log('  ✅ Tabla users y dependencias limpiadas.');

    // 1. CREATE USERS
    console.log('\n[Dewatering] 🌱 Creando 2 usuarios nuevos (Admin y Cliente)...');
    
    const adminHash = await bcrypt.hash('Admin@2026', 12);
    const clientHash = await bcrypt.hash('Client@2026', 12);

    const usersResult = await client.query(`
      INSERT INTO users (email, password_hash, full_name, phone, company, position, role) VALUES
        ('admin@dewatering.com', $1, 'Carlos Mendoza (Admin)', '+51 999 111 001', 'Dewatering Solutions', 'Gerente General', 'SUPER_ADMIN'),
        ('cliente@empresa.com', $2, 'Juan Pérez (Cliente)', '+51 999 222 001', 'Minera Andina SAC', 'Jefe de Operaciones', 'CLIENT')
      RETURNING id, role;
    `, [adminHash, clientHash]);
    
    let adminId, clientId;
    usersResult.rows.forEach(u => {
      if(u.role === 'SUPER_ADMIN') adminId = u.id;
      if(u.role === 'CLIENT') clientId = u.id;
    });

    console.log('  ✅ Administrador y Cliente creados.');

    // 2. CREATE SOME DEMO LEADS SO THE DASHBOARD ISN'T EMPTY
    console.log('\n[Dewatering] 🌱 Generando leads de prueba para el CRM...');
    await client.query(`
      INSERT INTO leads (contact_name, contact_email, contact_phone, company_name, company_sector, source, service_interest, message, status, priority, assigned_to) VALUES
        ('Roberto Silva', 'rsilva@minerasur.com', '+51 999 333 001', 'Minera Sur SAC', 'Minería', 'WEB', 'Filtración', 'Necesitamos evaluar filtros prensa para nuestra planta de relaves', 'NEW', 'HIGH', $1),
        ('Patricia Vargas', 'pvargas@cementos-peru.com', '+51 999 333 002', 'Cementos Perú', 'Industrial', 'REFERRAL', 'Espesamiento', 'Consulta sobre espesadores para nuestra línea de producción', 'CONTACTED', 'MEDIUM', $1),
        ('Luis Quispe', 'lquispe@goldmining.com', '+51 999 333 003', 'Gold Mining Corp', 'Minería', 'EVENT', 'Lixiviación', 'Interesados en ensayos de lixiviación para proyecto aurífero', 'PROPOSAL', 'URGENT', $1)
    `, [adminId]);
    console.log('  ✅ Leads de prueba creados.');

    console.log('\n[Dewatering] 🎉 Todo listo!');
    console.log('--------------------------------------------------');
    console.log('  👑 ADMIN   : admin@dewatering.com / Admin@2026');
    console.log('  🏢 CLIENTE : cliente@empresa.com / Client@2026');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('[Dewatering] ❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

resetAndSeed();

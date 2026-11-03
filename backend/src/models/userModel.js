import { query } from '../config/db.js';

class UserModel {
  // ==================== CRUD ====================

  async create(user) {
    const { email, password_hash, full_name, phone, company, position, role, is_active } = user;
    const sql = `
      INSERT INTO users (email, password_hash, full_name, phone, company, position, role, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, full_name, phone, company, position, role, is_active, created_at;
    `;
    const result = await query(sql, [
      email, password_hash, full_name, phone || null,
      company || null, position || null, role || 'CLIENT',
      is_active !== undefined ? is_active : true
    ]);
    return result.rows[0];
  }

  async findByEmail(email) {
    const sql = `SELECT * FROM users WHERE email = $1;`;
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  async findById(id) {
    const sql = `SELECT id, email, full_name, phone, company, position, role, is_active, mfa_enabled, backup_email, avatar_url, created_at, updated_at FROM users WHERE id = $1;`;
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  async findAll(filters = {}) {
    let sql = `
      SELECT id, email, full_name, phone, company, position, role, is_active, avatar_url, created_at, updated_at
      FROM users WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.role) {
      sql += ` AND role = $${idx++}`;
      params.push(filters.role);
    }
    if (filters.is_active !== undefined) {
      sql += ` AND is_active = $${idx++}`;
      params.push(filters.is_active);
    }
    if (filters.search) {
      sql += ` AND (full_name ILIKE $${idx} OR email ILIKE $${idx} OR company ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    sql += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${idx++}`;
      params.push(filters.limit);
    }
    if (filters.offset) {
      sql += ` OFFSET $${idx++}`;
      params.push(filters.offset);
    }

    const result = await query(sql, params);
    return result.rows;
  }

  async update(id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = ['full_name', 'phone', 'company', 'position', 'role', 'is_active', 'avatar_url', 'mfa_enabled', 'mfa_secret', 'backup_email'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = $${idx++}`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `
      UPDATE users SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, email, full_name, phone, company, position, role, is_active, avatar_url, created_at, updated_at;
    `;
    const result = await query(sql, values);
    return result.rows[0];
  }

  async updatePassword(id, password_hash) {
    const sql = `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email;`;
    const result = await query(sql, [password_hash, id]);
    return result.rows[0];
  }

  async getMfaSecret(id) {
    const sql = `SELECT mfa_secret FROM users WHERE id = $1;`;
    const result = await query(sql, [id]);
    return result.rows[0]?.mfa_secret;
  }

  async toggleActive(id, is_active) {
    const sql = `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, is_active;`;
    const result = await query(sql, [is_active, id]);
    return result.rows[0];
  }

  async delete(id) {
    try {
      // 1. Desvincular referencias previas para evitar violación de llave foránea
      await query(`UPDATE leads SET assigned_to = NULL WHERE assigned_to = $1;`, [id]).catch(() => {});
      await query(`UPDATE quotations SET created_by = NULL WHERE created_by = $1;`, [id]).catch(() => {});
      await query(`UPDATE quotations SET approved_by = NULL WHERE approved_by = $1;`, [id]).catch(() => {});
      await query(`UPDATE projects SET assigned_engineer = NULL WHERE assigned_engineer = $1;`, [id]).catch(() => {});
      await query(`UPDATE chatbot_conversations SET user_id = NULL WHERE user_id = $1;`, [id]).catch(() => {});
      await query(`DELETE FROM audit_logs WHERE user_id = $1;`, [id]).catch(() => {});
      
      const sql = `DELETE FROM users WHERE id = $1 RETURNING id, email;`;
      const result = await query(sql, [id]);
      if (result.rows && result.rows.length > 0) return result.rows[0];
      return { id };
    } catch (err) {
      // Fallback de seguridad: marcar como inactivo si tiene dependencias críticas
      const fallbackSql = `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, email;`;
      const fbResult = await query(fallbackSql, [id]);
      return fbResult.rows?.[0] || { id };
    }
  }

  // ==================== STATS ====================

  async getStats() {
    const sql = `
      SELECT 
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE is_active = true)::int as activos,
        COUNT(*) FILTER (WHERE is_active = false)::int as inactivos,
        COUNT(*) FILTER (WHERE role = 'CLIENT')::int as clientes,
        COUNT(*) FILTER (WHERE role IN ('ADMIN','SUPER_ADMIN'))::int as admins
      FROM users;
    `;
    const result = await query(sql);
    return result.rows[0];
  }
}

export default new UserModel();

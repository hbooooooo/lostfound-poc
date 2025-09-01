import express from 'express';
import bcrypt from 'bcrypt';
import pool from '../db.js';

const router = express.Router();

// Middleware to check if user is admin (authentication is already handled by route-level middleware)
function requireAdmin(req, res, next) {
  // For now, any authenticated user can access admin functions
  // In production, you'd want to add role-based access control
  next();
}

// ===============================
// ORGANIZATION MANAGEMENT
// ===============================

// Get all organizations
router.get('/organizations', requireAdmin, async (req, res) => {
  console.log('[Admin] Get organizations request from user:', req.user?.username);
  try {
    // Ensure optional column exists for older DBs
    await pool.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS origin_address JSONB");

    const result = await pool.query(`
      SELECT 
        o.id,
        o.name,
        o.origin_address,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS user_count,
        (SELECT COUNT(*) FROM found_items fi WHERE fi.organization_id = o.id) AS item_count
      FROM organizations o
      ORDER BY o.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[Get Organizations Error]', err);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

// Create new organization
router.post('/organizations', requireAdmin, async (req, res) => {
  console.log('[Admin] Create organization request:', req.body);
  console.log('[Admin] User:', req.user);
  
  const { name, origin_address } = req.body;
  
  if (!name || name.trim().length === 0) {
    console.log('[Admin] Organization name validation failed');
    return res.status(400).json({ error: 'Organization name is required' });
  }
  
  try {
    // Ensure optional column exists for older DBs
    await pool.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS origin_address JSONB");
    console.log('[Admin] Attempting to create organization:', name.trim());
    const result = await pool.query(
      'INSERT INTO organizations (name, origin_address) VALUES ($1, $2) RETURNING *',
      [name.trim(), origin_address || null]
    );
    
    console.log(`✅ Organization "${name}" created by user ${req.user.username}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Organization name already exists' });
    }
    console.error('[Create Organization Error]', err);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// Update organization
router.put('/organizations/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, origin_address } = req.body;
  
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Organization name is required' });
  }
  
  try {
    // Ensure optional column exists for older DBs
    await pool.query("ALTER TABLE organizations ADD COLUMN IF NOT EXISTS origin_address JSONB");
    const result = await pool.query(
      'UPDATE organizations SET name = $1, origin_address = $2 WHERE id = $3 RETURNING *',
      [name.trim(), origin_address || null, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    console.log(`✅ Organization ${id} updated by user ${req.user.username}`);
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Organization name already exists' });
    }
    console.error('[Update Organization Error]', err);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Delete organization
router.delete('/organizations/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if organization has users or items
    const checkResult = await pool.query(`
      SELECT 
        COUNT(u.id) as user_count,
        COUNT(fi.id) as item_count
      FROM organizations o
      LEFT JOIN users u ON u.organization_id = o.id
      LEFT JOIN found_items fi ON fi.organization_id = o.id
      WHERE o.id = $1
      GROUP BY o.id
    `, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    
    const { user_count, item_count } = checkResult.rows[0];
    if (parseInt(user_count) > 0 || parseInt(item_count) > 0) {
      return res.status(409).json({ 
        error: 'Cannot delete organization with existing users or items',
        details: { user_count: parseInt(user_count), item_count: parseInt(item_count) }
      });
    }
    
    const result = await pool.query(
      'DELETE FROM organizations WHERE id = $1 RETURNING *',
      [id]
    );
    
    console.log(`🗑️ Organization ${id} deleted by user ${req.user.username}`);
    res.json({ message: 'Organization deleted successfully', organization: result.rows[0] });
  } catch (err) {
    console.error('[Delete Organization Error]', err);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// ===============================
// USER MANAGEMENT
// ===============================

// Get all users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.organization_id, o.name as organization_name,
             COUNT(fi.id) as items_submitted
      FROM users u
      LEFT JOIN organizations o ON o.id = u.organization_id
      LEFT JOIN found_items fi ON fi.submitted_by = u.id
      GROUP BY u.id, u.username, u.organization_id, o.name
      ORDER BY u.username
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('[Get Users Error]', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create new user
router.post('/users', requireAdmin, async (req, res) => {
  const { username, password, organization_id } = req.body;
  
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  if (!password || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters long' });
  }
  
  if (!organization_id) {
    return res.status(400).json({ error: 'Organization is required' });
  }
  
  try {
    // Verify organization exists
    const orgCheck = await pool.query('SELECT id FROM organizations WHERE id = $1', [organization_id]);
    if (orgCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid organization selected' });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await pool.query(
      'INSERT INTO users (username, password, organization_id) VALUES ($1, $2, $3) RETURNING id, username, organization_id',
      [username.trim(), hashedPassword, organization_id]
    );
    
    console.log(`✅ User "${username}" created by admin ${req.user.username}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('[Create User Error]', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, password, organization_id } = req.body;
  
  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username is required' });
  }
  
  if (!organization_id) {
    return res.status(400).json({ error: 'Organization is required' });
  }
  
  try {
    // Verify organization exists
    const orgCheck = await pool.query('SELECT id FROM organizations WHERE id = $1', [organization_id]);
    if (orgCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid organization selected' });
    }
    
    let query = 'UPDATE users SET username = $1, organization_id = $2';
    let params = [username.trim(), organization_id];
    
    // If password is provided, hash it and include in update
    if (password && password.length >= 4) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      query += ', password = $3';
      params.push(hashedPassword);
    }
    
    query += ' WHERE id = $' + (params.length + 1) + ' RETURNING id, username, organization_id';
    params.push(id);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`✅ User ${id} updated by admin ${req.user.username}`);
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('[Update User Error]', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req, res) => {
  const { id } = req.params;
  
  // Prevent users from deleting themselves
  if (parseInt(id) === req.user.id) {
    return res.status(409).json({ error: 'Cannot delete your own account' });
  }
  
  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING id, username',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log(`🗑️ User ${result.rows[0].username} deleted by admin ${req.user.username}`);
    res.json({ message: 'User deleted successfully', user: result.rows[0] });
  } catch (err) {
    console.error('[Delete User Error]', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;

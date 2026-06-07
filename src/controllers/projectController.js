const { pool } = require('../config/db');

// Get all projects
async function getProjects(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects.' });
  }
}

// Add a new project (Admin only)
async function createProject(req, res) {
  const { title, description, github_link, live_link, technologies } = req.body;
  if (!title || !description || !technologies) {
    return res.status(400).json({ error: 'Title, description and technologies are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO projects (title, description, github_link, live_link, technologies) VALUES (?, ?, ?, ?, ?)',
      [title, description, github_link || null, live_link || null, technologies]
    );
    res.status(201).json({ id: result.insertId, title, description, github_link, live_link, technologies });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create project.' });
  }
}

// Update project (Admin only)
async function updateProject(req, res) {
  const { id } = req.params;
  const { title, description, github_link, live_link, technologies } = req.body;
  if (!title || !description || !technologies) {
    return res.status(400).json({ error: 'Title, description and technologies are required.' });
  }
  try {
    const [result] = await pool.query(
      'UPDATE projects SET title = ?, description = ?, github_link = ?, live_link = ?, technologies = ? WHERE id = ?',
      [title, description, github_link || null, live_link || null, technologies, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json({ id, title, description, github_link, live_link, technologies });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project.' });
  }
}

// Delete project (Admin only)
async function deleteProject(req, res) {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found.' });
    }
    res.json({ message: 'Project deleted successfully!' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete project.' });
  }
}

module.exports = {
  getProjects,
  createProject,
  updateProject,
  deleteProject
};

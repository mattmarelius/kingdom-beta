import mysql from 'mysql';

const app = express();
const PORT = 3001;

// Create a connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'asdf1234',
  database: 'catalogoflife',
  connectionLimit: 10 // Adjust as needed
});

// Middleware to parse JSON
app.use(express.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Common names endpoint
app.get('/api/common-names', (req, res) => {
  pool.query(
    "SELECT common_name FROM common_names WHERE language = 'English'",
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results.map(row => row.common_name));
    }
  );
});

// Taxonomy endpoint
app.get('/api/taxonomy', (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: 'Name parameter is required' });
  pool.query(
    'SELECT kingdom, `order`, family, genus, species FROM taxon WHERE common_name = ?',
    [name],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0] || {});
    }
  );
});

// Daily target endpoint
app.get('/api/daily-target', (req, res) => {
  const date = new Date().toISOString().split('T')[0];
  const query = `
    SELECT * FROM daily_targets
    ORDER BY ABS(CRC32(CONCAT(?, common_name)) % (SELECT COUNT(*) FROM daily_targets))
    LIMIT 1
  `;
  pool.query(query, [date], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results[0] || {});
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('MySQL Pool Error:', err);
});

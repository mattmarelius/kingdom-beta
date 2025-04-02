const express = require('express');
const mysql = require('mysql2');
const app = express();

const PORT = process.env.PORT || 3001;

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'asdf1234',
  database: 'catalogoflife'
});

connection.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Common Names Endpoint (for dropdown)
app.get('/api/common-names', (req, res) => {
  const query = `
    SELECT DISTINCT common_name
    FROM common_names
    WHERE language = 'English'
    ORDER BY common_name
  `;
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const names = results.map(row => row.common_name);
    res.json(names);
  });
});

// Taxonomy Endpoint
app.get('/api/taxonomy', (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Missing "name" parameter' });

  const query = `
    SELECT DISTINCT
      sn.species,
      sn.genus,
      f.family,
      f.order AS order_name,
      f.kingdom
    FROM common_names cn
    JOIN scientific_names sn ON cn.name_code = sn.name_code
    JOIN families f ON sn.family_id = f.record_id
    WHERE LOWER(TRIM(cn.common_name)) = LOWER(?) AND cn.language = 'English'
    LIMIT 1
  `;

  connection.query(query, [name], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.json({});
    const taxonomy = {
      species: results[0].species ? `${results[0].genus} ${results[0].species}` : null,
      genus: results[0].genus,
      family: results[0].family,
      order: results[0].order_name,
      kingdom: results[0].kingdom
    };
    res.json(taxonomy);
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
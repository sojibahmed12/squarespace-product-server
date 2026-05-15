// server.js
// Step 1:  npm install express node-fetch
// Step 2:  node server.js
// Step 3:  Open http://localhost:3000 in your browser

const express = require('express');
const fetch   = require('node-fetch');
const path    = require('path');

const API_KEY = '540dd940-cd5c-41aa-ae3a-78d73e71ab49';
const PORT    = 3000;
const app     = express();

// Serve shop.html when you open http://localhost:3000
app.use(express.static(path.join(__dirname)));

// Allow browser to call this server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

// The browser calls /api/products → this server calls Squarespace
app.get('/api/products', async (req, res) => {
  console.log('📡 Fetching from Squarespace...');

  let allProducts = [];
  let nextCursor  = null;
  let hasNextPage = true;

  try {
    while (hasNextPage) {
      const url = new URL('https://api.squarespace.com/1.0/commerce/products');
      if (nextCursor) url.searchParams.append('cursor', nextCursor);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'User-Agent':    'NodeJS/18.0.0',
          'Content-Type':  'application/json'
        }
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Squarespace ${response.status}: ${errText}`);
      }

      const data = await response.json();
      if (!data.products || data.products.length === 0) break;

      allProducts = [...allProducts, ...data.products];
      hasNextPage = data.pagination?.hasNextPage || false;
      nextCursor  = data.pagination?.nextPageCursor || null;
    }

    console.log(`✅ Sending ${allProducts.length} products to browser`);
    res.json(allProducts);

  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('✅ Server is running!');
  console.log(`👉 Open in your browser: http://localhost:${PORT}`);
  console.log('   Press Ctrl+C to stop.');
  console.log('');
});
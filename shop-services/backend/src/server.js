'use strict';
require('dotenv').config();
const app = require('./app');
const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`\n🚀  Inventory API running on http://localhost:${port}`);
  console.log(`📋  Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️   DB Host     : ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}\n`);
});

// Vercel serverless function entry point
const path = require('path');

// Set the working directory to the project root
process.chdir(path.join(__dirname, '..'));

// Import and start the server
const server = require('../dist/index.cjs');

module.exports = server;

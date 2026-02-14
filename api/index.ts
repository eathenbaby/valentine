// Vercel Serverless Function Entry Point
import express from 'express';
import path from 'path';
import fs from 'fs';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static files from dist/public
const distPath = path.join(process.cwd(), 'dist', 'public');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // SPA fallback - serve index.html for non-API routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/assets')) {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Not found');
      }
    } else {
      res.status(404).json({ message: 'API endpoint not found' });
    }
  });
} else {
  app.get('*', (_req, res) => {
    res.status(500).json({ 
      message: 'Build directory not found',
      path: distPath 
    });
  });
}

// Error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Error:', err);
  res.status(500).json({ 
    message: err.message || 'Internal Server Error'
  });
});

export default app;

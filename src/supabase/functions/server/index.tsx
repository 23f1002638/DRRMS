import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { corsConfig } from './config.tsx';
import { initializeStorage } from './helpers.tsx';
import * as kv from './kv_store.tsx';

// Import all route modules
import { auth } from './routes/auth.tsx';
import { aidRequests } from './routes/aidRequests.tsx';
import { volunteers } from './routes/volunteers.tsx';
import { inventory } from './routes/inventory.tsx';
import { analytics } from './routes/analytics.tsx';
import { uploads } from './routes/uploads.tsx';

const app = new Hono();

// CORS middleware
app.use('*', cors(corsConfig));

// Logger middleware  
app.use('*', logger(console.log));

// Initialize storage on startup
try {
  await initializeStorage();
  console.log('✅ Storage initialization completed');
} catch (error) {
  console.error('❌ Storage initialization failed:', error);
}

// Mount routes with prefix
app.route('/make-server-2c635a46/auth', auth);
app.route('/make-server-2c635a46', auth); // For /user/profile route
app.route('/make-server-2c635a46/aid-requests', aidRequests);
app.route('/make-server-2c635a46/volunteer', volunteers);
app.route('/make-server-2c635a46/inventory', inventory);
app.route('/make-server-2c635a46/analytics', analytics);
app.route('/make-server-2c635a46/upload', uploads);

// Enhanced health check with database connectivity test
app.get('/make-server-2c635a46/health', async (c) => {
  try {
    // Test KV store connectivity
    const testKey = 'health_check_test';
    const testValue = { timestamp: new Date().toISOString(), test: true };
    
    await kv.set(testKey, testValue);
    const retrieved = await kv.get(testKey);
    await kv.del(testKey);
    
    const dbHealthy = retrieved && retrieved.test === true;
    
    return c.json({ 
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'disaster-relief-backend',
      database: dbHealthy ? 'connected' : 'disconnected',
      version: '2.0.1'
    });
  } catch (error) {
    console.error('Health check error:', error);
    return c.json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'disaster-relief-backend',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      version: '2.0.1'
    }, 500);
  }
});

// Debug endpoint for development 
app.get('/make-server-2c635a46/debug/kv', async (c) => {
  try {
    const allKeys = await kv.getByPrefix('');
    return c.json({ 
      status: 'success',
      total_keys: allKeys.length,
      sample_keys: allKeys.slice(0, 5),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Debug KV error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Root endpoint for basic info
app.get('/make-server-2c635a46', (c) => {
  return c.json({ 
    name: 'Disaster Relief Management System API',
    version: '2.0.1',
    status: 'running',
    endpoints: [
      '/health - Health check',
      '/auth/signup - User registration', 
      '/user/profile - User profile',
      '/aid-requests - Aid request management',
      '/volunteer - Volunteer management',
      '/inventory - Inventory management',
      '/analytics - Analytics data',
      '/upload - File uploads'
    ]
  });
});

// Start the server
console.log('🚀 Starting Disaster Relief Management Server v2.0.1...');
console.log('📡 Available at https://{project-id}.supabase.co/functions/v1/make-server-2c635a46');

Deno.serve(app.fetch);
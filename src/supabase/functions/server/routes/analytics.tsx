import { Hono } from 'npm:hono';
import { verifyUser, calculateAnalytics, checkUserPermissions } from '../helpers.tsx';
import * as kv from '../kv_store.tsx';

const analytics = new Hono();

// Get analytics data
analytics.get('/', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const isAdmin = await checkUserPermissions(user.id, ['admin']);
    
    if (!isAdmin) {
      return c.json({ error: 'Admin access required for analytics' }, 403);
    }

    // Fetch all data for analytics
    const [aidRequests, volunteers, inventoryItems] = await Promise.all([
      kv.getByPrefix('aid_request:'),
      kv.getByPrefix('user:').then(users => users.filter(u => u.role === 'volunteer')),
      kv.getByPrefix('inventory:')
    ]);

    const analyticsData = calculateAnalytics(aidRequests, volunteers, inventoryItems);

    return c.json({ analytics: analyticsData });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    return c.json({ error: 'Failed to generate analytics' }, 500);
  }
});

export { analytics };
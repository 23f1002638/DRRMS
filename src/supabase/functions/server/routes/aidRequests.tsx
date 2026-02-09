import { Hono } from 'npm:hono';
import { verifyUser, generateId } from '../helpers.tsx';
import * as kv from '../kv_store.tsx';

const aidRequests = new Hono();

// Create aid request
aidRequests.post('/', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const requestData = await c.req.json();
    const aidRequestId = generateId('aid_request');
    
    const aidRequest = {
      id: aidRequestId,
      ...requestData,
      user_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`aid_request:${aidRequestId}`, aidRequest);
    await kv.set(`user_requests:${user.id}:${aidRequestId}`, aidRequestId);

    return c.json({ aid_request: aidRequest });
  } catch (error) {
    console.error('Aid request creation error:', error);
    return c.json({ error: 'Failed to create aid request' }, 500);
  }
});

// Get aid requests
aidRequests.get('/', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);
    const userRole = userProfile?.role;
    
    let aidRequestsList = [];

    if (userRole === 'admin' || userRole === 'volunteer') {
      // Admin and volunteers can see all requests
      const allRequests = await kv.getByPrefix('aid_request:');
      aidRequestsList = allRequests;
    } else {
      // Users can only see their own requests
      const userRequestIds = await kv.getByPrefix(`user_requests:${user.id}:`);
      const requestPromises = userRequestIds.map(async (id) => {
        return await kv.get(`aid_request:${id}`);
      });
      aidRequestsList = (await Promise.all(requestPromises)).filter(Boolean);
    }

    return c.json({ aid_requests: aidRequestsList });
  } catch (error) {
    console.error('Aid requests fetch error:', error);
    return c.json({ error: 'Failed to fetch aid requests' }, 500);
  }
});

// Update aid request
aidRequests.put('/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const requestId = c.req.param('id');
    const updateData = await c.req.json();
    const userProfile = await kv.get(`user:${user.id}`);
    
    const existingRequest = await kv.get(`aid_request:${requestId}`);
    if (!existingRequest) {
      return c.json({ error: 'Aid request not found' }, 404);
    }

    // Check permissions
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'volunteer' && existingRequest.user_id !== user.id) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const updatedRequest = {
      ...existingRequest,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    await kv.set(`aid_request:${requestId}`, updatedRequest);
    return c.json({ aid_request: updatedRequest });
  } catch (error) {
    console.error('Aid request update error:', error);
    return c.json({ error: 'Failed to update aid request' }, 500);
  }
});

export { aidRequests };
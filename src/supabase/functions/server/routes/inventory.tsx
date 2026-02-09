import { Hono } from 'npm:hono';
import { verifyUser, generateId, checkUserPermissions } from '../helpers.tsx';
import * as kv from '../kv_store.tsx';

const inventory = new Hono();

// Create inventory item
inventory.post('/', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const hasPermission = await checkUserPermissions(user.id, ['admin', 'volunteer']);
    
    if (!hasPermission) {
      return c.json({ error: 'Insufficient permissions to manage inventory' }, 403);
    }

    const inventoryData = await c.req.json();
    const inventoryId = generateId('inventory');
    
    const inventoryItem = {
      id: inventoryId,
      ...inventoryData,
      added_by: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`inventory:${inventoryId}`, inventoryItem);
    return c.json({ inventory_item: inventoryItem });
  } catch (error) {
    console.error('Inventory creation error:', error);
    return c.json({ error: 'Failed to create inventory item' }, 500);
  }
});

// Get inventory items
inventory.get('/', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const inventoryItems = await kv.getByPrefix('inventory:');
    return c.json({ inventory: inventoryItems });
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return c.json({ error: 'Failed to fetch inventory' }, 500);
  }
});

// Update inventory item
inventory.put('/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const hasPermission = await checkUserPermissions(user.id, ['admin', 'volunteer']);
    
    if (!hasPermission) {
      return c.json({ error: 'Insufficient permissions to update inventory' }, 403);
    }

    const inventoryId = c.req.param('id');
    const updateData = await c.req.json();
    
    const existingItem = await kv.get(`inventory:${inventoryId}`);
    if (!existingItem) {
      return c.json({ error: 'Inventory item not found' }, 404);
    }

    const updatedItem = {
      ...existingItem,
      ...updateData,
      updated_at: new Date().toISOString(),
      updated_by: user.id
    };

    await kv.set(`inventory:${inventoryId}`, updatedItem);
    return c.json({ inventory_item: updatedItem });
  } catch (error) {
    console.error('Inventory update error:', error);
    return c.json({ error: 'Failed to update inventory item' }, 500);
  }
});

export { inventory };
import { Hono } from 'npm:hono';
import { supabase } from '../config.tsx';
import { verifyUser } from '../helpers.tsx';
import * as kv from '../kv_store.tsx';

const auth = new Hono();

// User signup
auth.post('/signup', async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { 
        name,
        role,
        created_at: new Date().toISOString()
      },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.error('Signup error:', error);
      return c.json({ error: `Signup failed: ${error.message}` }, 400);
    }

    // Store additional user data in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      role,
      created_at: new Date().toISOString(),
      last_active: new Date().toISOString()
    });

    return c.json({ 
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Get user profile
auth.get('/user/profile', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);
    
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    return c.json({ user: userProfile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return c.json({ error: 'Failed to fetch user profile' }, 500);
  }
});

export { auth };
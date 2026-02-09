import { Hono } from 'npm:hono';
import { verifyUser, generateId, checkUserPermissions } from '../helpers.tsx';
import * as kv from '../kv_store.tsx';

const volunteers = new Hono();

// Get all volunteers (for admin dashboard)
volunteers.get('/', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);
    
    if (userProfile?.role !== 'admin' && userProfile?.role !== 'volunteer') {
      return c.json({ error: 'Insufficient permissions to view volunteers' }, 403);
    }

    // Get all users with volunteer role
    const allUsers = await kv.getByPrefix('user:');
    const volunteersList = allUsers.filter(u => u.role === 'volunteer');
    
    // Get assignments for each volunteer
    const volunteersWithAssignments = await Promise.all(
      volunteersList.map(async (volunteer) => {
        const assignmentIds = await kv.getByPrefix(`volunteer_assignments:${volunteer.id}:`);
        const assignments = await Promise.all(
          assignmentIds.map(async (id) => await kv.get(`volunteer_assignment:${id}`))
        );
        
        return {
          ...volunteer,
          assignments: assignments.filter(Boolean),
          active_assignments: assignments.filter(a => a && a.status === 'active').length
        };
      })
    );

    return c.json({ volunteers: volunteersWithAssignments });
  } catch (error) {
    console.error('Volunteers fetch error:', error);
    return c.json({ error: 'Failed to fetch volunteers' }, 500);
  }
});

// Create volunteer assignment
volunteers.post('/assignments', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const isAdmin = await checkUserPermissions(user.id, ['admin']);
    
    if (!isAdmin) {
      return c.json({ error: 'Only admins can create volunteer assignments' }, 403);
    }

    const assignmentData = await c.req.json();
    const assignmentId = generateId('volunteer_assignment');
    
    const assignment = {
      id: assignmentId,
      ...assignmentData,
      assigned_by: user.id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`volunteer_assignment:${assignmentId}`, assignment);
    
    // Link assignment to volunteer
    if (assignment.volunteer_id) {
      await kv.set(`volunteer_assignments:${assignment.volunteer_id}:${assignmentId}`, assignmentId);
    }

    return c.json({ assignment });
  } catch (error) {
    console.error('Volunteer assignment error:', error);
    return c.json({ error: 'Failed to create volunteer assignment' }, 500);
  }
});

// Get volunteer assignments
volunteers.get('/assignments', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const userProfile = await kv.get(`user:${user.id}`);
    let assignments = [];

    if (userProfile?.role === 'admin') {
      // Admins can see all assignments
      assignments = await kv.getByPrefix('volunteer_assignment:');
    } else if (userProfile?.role === 'volunteer') {
      // Volunteers can see their own assignments
      const volunteerAssignmentIds = await kv.getByPrefix(`volunteer_assignments:${user.id}:`);
      const assignmentPromises = volunteerAssignmentIds.map(async (id) => {
        return await kv.get(`volunteer_assignment:${id}`);
      });
      assignments = (await Promise.all(assignmentPromises)).filter(Boolean);
    } else {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    return c.json({ assignments });
  } catch (error) {
    console.error('Volunteer assignments fetch error:', error);
    return c.json({ error: 'Failed to fetch volunteer assignments' }, 500);
  }
});

// Assign volunteer to task
volunteers.post('/:id/assign', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const isAdmin = await checkUserPermissions(user.id, ['admin']);
    
    if (!isAdmin) {
      return c.json({ error: 'Only admins can assign volunteers' }, 403);
    }

    const volunteerId = c.req.param('id');
    const taskData = await c.req.json();
    
    const assignmentId = generateId('volunteer_assignment');
    
    const assignment = {
      id: assignmentId,
      volunteer_id: volunteerId,
      ...taskData,
      assigned_by: user.id,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await kv.set(`volunteer_assignment:${assignmentId}`, assignment);
    await kv.set(`volunteer_assignments:${volunteerId}:${assignmentId}`, assignmentId);

    return c.json({ assignment });
  } catch (error) {
    console.error('Volunteer assignment error:', error);
    return c.json({ error: 'Failed to assign volunteer' }, 500);
  }
});

// Update assignment status
volunteers.put('/assignments/:id', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const assignmentId = c.req.param('id');
    const updateData = await c.req.json();
    const userProfile = await kv.get(`user:${user.id}`);
    
    const existingAssignment = await kv.get(`volunteer_assignment:${assignmentId}`);
    if (!existingAssignment) {
      return c.json({ error: 'Assignment not found' }, 404);
    }

    // Check permissions
    const isAdmin = userProfile?.role === 'admin';
    const isAssignedVolunteer = existingAssignment.volunteer_id === user.id;
    
    if (!isAdmin && !isAssignedVolunteer) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }

    const updatedAssignment = {
      ...existingAssignment,
      ...updateData,
      updated_at: new Date().toISOString()
    };

    await kv.set(`volunteer_assignment:${assignmentId}`, updatedAssignment);
    return c.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error('Assignment update error:', error);
    return c.json({ error: 'Failed to update assignment' }, 500);
  }
});

export { volunteers };
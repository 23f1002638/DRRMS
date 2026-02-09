import { supabase, STORAGE_BUCKETS, MIME_TYPES, FILE_SIZE_LIMIT } from './config.tsx';
import * as kv from './kv_store.tsx';

// Helper function to verify user authentication
export async function verifyUser(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { user: null, error: 'No authorization token provided' };
  }

  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  
  if (error || !user) {
    return { user: null, error: 'Unauthorized access' };
  }

  return { user, error: null };
}

// Helper function to check user permissions
export async function checkUserPermissions(userId: string, requiredRoles: string[]) {
  const userProfile = await kv.get(`user:${userId}`);
  return userProfile && requiredRoles.includes(userProfile.role);
}

// Helper function to generate unique IDs
export function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Initialize storage buckets on startup
export async function initializeStorage() {
  for (const bucketName of STORAGE_BUCKETS) {
    const { data: existingBuckets } = await supabase.storage.listBuckets();
    const bucketExists = existingBuckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false,
        allowedMimeTypes: bucketName.includes('images') 
          ? MIME_TYPES.images
          : MIME_TYPES.documents,
        fileSizeLimit: FILE_SIZE_LIMIT
      });
      
      if (error) {
        console.error(`Error creating bucket ${bucketName}:`, error);
      } else {
        console.log(`Successfully created bucket: ${bucketName}`);
      }
    }
  }
}

// Helper function to calculate analytics
export function calculateAnalytics(aidRequests: any[], volunteers: any[], inventory: any[]) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

  const recentRequests = aidRequests.filter(req => 
    new Date(req.created_at) >= thirtyDaysAgo
  );

  return {
    total_aid_requests: aidRequests.length,
    pending_requests: aidRequests.filter(req => req.status === 'pending').length,
    completed_requests: aidRequests.filter(req => req.status === 'completed').length,
    total_volunteers: volunteers.length,
    active_volunteers: volunteers.filter(v => 
      new Date(v.last_active || v.created_at) >= thirtyDaysAgo
    ).length,
    total_inventory_items: inventory.length,
    low_stock_items: inventory.filter(item => (item.quantity || 0) < (item.minimum_quantity || 10)).length,
    requests_last_30_days: recentRequests.length,
    request_categories: aidRequests.reduce((acc, req) => {
      const category = req.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {}),
    request_priorities: aidRequests.reduce((acc, req) => {
      const priority = req.priority || 'Medium';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {}),
    generated_at: new Date().toISOString()
  };
}
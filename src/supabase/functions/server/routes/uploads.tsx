import { Hono } from 'npm:hono';
import { verifyUser } from '../helpers.tsx';
import { supabase, VALID_UPLOAD_BUCKETS } from '../config.tsx';

const uploads = new Hono();

// File upload endpoint
uploads.post('/:bucket', async (c) => {
  const { user, error: authError } = await verifyUser(c.req);
  
  if (authError) {
    return c.json({ error: authError }, 401);
  }

  try {
    const bucket = c.req.param('bucket');
    
    if (!VALID_UPLOAD_BUCKETS.includes(bucket)) {
      return c.json({ error: 'Invalid bucket specified' }, 400);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    const fileName = `${user.id}/${Date.now()}_${file.name}`;
    const bucketName = `make-2c635a46-${bucket}`;
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) {
      console.error('File upload error:', error);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    // Generate signed URL
    const { data: signedUrl } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    return c.json({ 
      file_path: fileName,
      signed_url: signedUrl?.signedUrl 
    });
  } catch (error) {
    console.error('File upload error:', error);
    return c.json({ error: 'File upload failed' }, 500);
  }
});

export { uploads };
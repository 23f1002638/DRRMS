
-- =====================================================
-- FUNCTION: claim_task
-- Allows a volunteer to claim a task and updates linked request
-- =====================================================
CREATE OR REPLACE FUNCTION claim_task(task_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_task_record RECORD;
  v_aid_request_id UUID;
BEGIN
  -- Check if task exists and is available
  SELECT * INTO v_task_record FROM volunteer_tasks
  WHERE id = task_id AND status = 'available'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Task not found or already claimed');
  END IF;

  -- Get aid request id
  v_aid_request_id := v_task_record.aid_request_id;

  -- Update task
  UPDATE volunteer_tasks
  SET 
    volunteer_id = auth.uid(),
    status = 'claimed',
    claimed_at = NOW()
  WHERE id = task_id;

  -- Update linked aid request if it exists
  IF v_aid_request_id IS NOT NULL THEN
    UPDATE aid_requests
    SET 
      assigned_volunteer_id = auth.uid(),
      status = 'assigned',
      updated_at = NOW()
    WHERE id = v_aid_request_id;
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

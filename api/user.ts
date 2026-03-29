import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tgsojwhkknwynnokzini.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc29qd2hra253eW5ub2t6aW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODgwMDksImV4cCI6MjA4NDQ2NDAwOX0.qw1504Eeiic71bt0DsWH7jSEhzgrGzmXQI_hWHHKoyg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const email = req.query.email as string | undefined;
  const userId = req.query.userId as string | undefined;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: allUsers, error } = await supabase
      .from('app_users')
      .select('id, data');

    return res.status(200).json({ 
      debug: true,
      userCount: allUsers?.length || 0,
      users: allUsers?.slice(0, 2),
      error: error?.message
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}

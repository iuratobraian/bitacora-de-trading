import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tgsojwhkknwynnokzini.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc29qd2hra253eW5ub2t6aW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODgwMDksImV4cCI6MjA4NDQ2NDAwOX0.qw1504Eeiic71bt0DsWH7jSEhzgrGzmXQI_hWHHKoyg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, userId } = req.query;

  if (!email && !userId) {
    return res.status(400).json({ error: 'email or userId is required' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data: allUsers, error } = await supabase
      .from('app_users')
      .select('id, data');

    if (error || !allUsers || allUsers.length === 0) {
      return res.status(404).json({ error: 'No users in database' });
    }

    let targetUser: any = null;

    if (userId && typeof userId === 'string') {
      targetUser = allUsers.find((u: any) => u.id === userId);
    } else if (email && typeof email === 'string') {
      targetUser = allUsers.find((u: any) => 
        u.data?.email?.toLowerCase() === email.toLowerCase()
      );
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = targetUser.data as any;
    
    return res.status(200).json({
      id: targetUser.id,
      email: userData?.email || '',
      displayName: userData?.name || 'Trader',
      role: userData?.role || 'USER'
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

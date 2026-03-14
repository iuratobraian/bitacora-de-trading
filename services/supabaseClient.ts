import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const SUPABASE_URL = 'https://tgsojwhkknwynnokzini.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc29qd2hra253eW5ub2t6aW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODgwMDksImV4cCI6MjA4NDQ2NDAwOX0.qw1504Eeiic71bt0DsWH7jSEhzgrGzmXQI_hWHHKoyg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check connection
export const checkSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('app_users').select('count', { count: 'exact', head: true });
        if (error) throw error;
        return true;
    } catch (e) {
        console.error("Supabase Connection Failed:", e);
        return false;
    }
};
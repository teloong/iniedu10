import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Ganti sesuai project Supabase Anda
const supabaseUrl = 'https://jcfizceoycwdvpqpwhrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch data awal videos
export async function fetchVideos() {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .order('id', { ascending: false });
  return { data, error };
}

// Subscribe realtime perubahan videos
export function subscribeVideos(onChange) {
  return supabase
    .channel('public:videos')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'videos' }, payload => {
      onChange(payload);
    })
    .subscribe();
}

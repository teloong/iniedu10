import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Ganti dengan URL dan anon key project Anda
const supabaseUrl = 'https://jcfizceoycwdvpqpwhrj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA';
const supabase = createClient(supabaseUrl, supabaseKey);

// Subscribe ke perubahan pada tabel blog (INSERT, UPDATE, DELETE)
supabase
  .channel('public:blog')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'blog' },
    payload => {
      console.log('Perubahan realtime pada tabel blog:', payload);
      // TODO: Update UI blog di sini jika ingin langsung render ulang
      // Contoh: fetch ulang data, atau update list secara manual
    }
  )
  .subscribe();

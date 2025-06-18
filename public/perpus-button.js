import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn-baca-sekarang').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const kategori = btn.getAttribute('data-kategori');
      const href = btn.getAttribute('href');
      try {
        await supabase.from('perpustakaan_clicks').insert({ kategori });
        window.location.href = href;
      } catch (err) {
        window.location.href = href;
      }
    });
  });
});

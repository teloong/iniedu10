// Endpoint sederhana: fetch data user terbaru dari Firebase Admin REST API
// NOTE: Untuk produksi, gunakan backend server, jangan expose key di frontend!
// Contoh ini hanya untuk testing lokal/development.

export async function onRequest(context) {
  const FIREBASE_API_KEY = 'AIzaSyAlxYWD4bCwpoKEErXDX1_4AZC9wzQTkwA';
  const PROJECT_ID = 'iniedu';
  // Hanya untuk demo, gunakan Auth Bearer token dari Firebase Admin jika di server
  // Untuk production WAJIB backend!

  const url = `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:batchGet?key=${FIREBASE_API_KEY}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  const json = await res.json();
  // Ambil 10 user terbaru (urutkan by createdAt desc)
  const users = (json.users || [])
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(u => ({
      email: u.email,
      displayName: u.displayName,
      created_at: new Date(Number(u.createdAt)).toISOString().slice(0, 10)
    }));
  return new Response(JSON.stringify({ users }), { headers: { 'Content-Type': 'application/json' } });
}

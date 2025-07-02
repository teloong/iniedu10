// Refactor: fetch & CRUD video pakai backend PHP (bukan Supabase)
const VIDEOS_API_URL = "https://iniedu.id/admin-video.php"; // Ganti sesuai lokasi videos.php di hosting Anda

// Fetch data awal videos dari backend PHP
export async function fetchVideos() {
  try {
    const res = await fetch(VIDEOS_API_URL, { method: "GET" });
    if (!res.ok) throw new Error("Gagal fetch data video");
    const data = await res.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Dummy subscribeVideos: polling sederhana (jika ingin realtime, bisa pakai WebSocket atau polling interval)
export function subscribeVideos(onChange) {
  // Polling setiap 10 detik
  const interval = setInterval(async () => {
    const { data } = await fetchVideos();
    onChange(data);
  }, 10000);
  return {
    unsubscribe: () => clearInterval(interval)
  };
}

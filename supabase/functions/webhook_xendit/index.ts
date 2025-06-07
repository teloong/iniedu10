import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ambil environment variable Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  console.log("Webhook Xendit received:", body);

  // Cek status pembayaran
  if (body.status === "PAID") {
    // Ambil data yang diperlukan dari webhook
    const user_uid = body.user_id || null;
    const email = body.payer_email || null;
    let nama_kursus = null;
    let nama_lengkap = null;
    if (body.metadata && (body.metadata.nama_kursus || body.metadata.nama_lengkap)) {
      nama_kursus = body.metadata.nama_kursus || null;
      nama_lengkap = body.metadata.nama_lengkap || null;
    } else if (body.description && body.description.includes('|||')) {
      const split = body.description.split('|||');
      nama_kursus = split[0];
      nama_lengkap = split[1] || null;
    } else {
      nama_kursus = body.description || null;
    }
    const id_kursus = body.external_id || null;
    const harga = body.amount || null;

    // Insert ke tabel pembelian_kursus dengan field yang sesuai tabel
    const { error } = await supabase.from("pembelian_kursus").insert([
      {
        user_uid,
        email,
        nama_lengkap,
        nama_kursus,
        id_kursus,
        harga,
        status_pembayaran: "PAID",
        waktu_pembelian: new Date().toISOString(),
        payment_method: body.payment_method || null,
      },
    ]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response("Supabase insert error", { status: 500 });
    }

    return new Response("OK", { status: 200 });
  }

  // Jika status bukan PAID, abaikan
  return new Response("Ignored", { status: 200 });
});

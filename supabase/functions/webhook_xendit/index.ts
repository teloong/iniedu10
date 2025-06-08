import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ambil environment variable Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response("Invalid JSON", { status: 400, headers: corsHeaders });
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

    // VALIDASI ANTI DUPLIKAT
    // VALIDASI ANTI DUPLIKAT BERDASARKAN EMAIL + NAMA_KURSUS
    if (email && nama_kursus) {
      const { data: existing, error: cekError } = await supabase
        .from("pembelian_kursus")
        .select("id")
        .eq("email", email)
        .eq("nama_kursus", nama_kursus)
        .maybeSingle();
      if (cekError) {
        return new Response("Supabase select error", { status: 500, headers: corsHeaders });
      }
      if (existing) {
        return new Response("Sudah pernah beli", { status: 409, headers: corsHeaders });
      }
    }
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
      return new Response("Supabase insert error", { status: 500, headers: corsHeaders });
    }

    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  // Jika status bukan PAID, abaikan
  return new Response("Ignored", { status: 200, headers: corsHeaders });
  } catch (e) {
    // Tangkap SEMUA error, selalu balas dengan header CORS
    return new Response(JSON.stringify({ error: e.message || "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

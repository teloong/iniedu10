// deno-lint-ignore-file
declare const Deno: any;
// @ts-ignore
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ambil environment variable Supabase
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
// @ts-ignore
const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");

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

    // Cek status pembayaran
    if (body.status === "PAID") {
      let pembelianId: string | null = null;
      // Ambil data yang diperlukan dari webhook
      const user_uid = body.metadata?.user_uid || null;
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
        // Query Supabase pembelian_kursus
        const { data: existing, error: cekError } = await supabase
          .from("pembelian_kursus")
          .select("id")
          .eq("email", email)
          .eq("nama_kursus", nama_kursus)
          .maybeSingle();
      if (cekError) {
        return new Response("Supabase select error", { status: 500, headers: corsHeaders });
      }
      if (existing && existing.id) {
        pembelianId = existing.id;
      }
    }
    if (pembelianId) {
      // Jika sudah ada, update status_pembayaran ke PAID dan update waktu_pembelian
      const { error: updateErr } = await supabase
        .from("pembelian_kursus")
        .update({
          status_pembayaran: "PAID",
          waktu_pembelian: new Date().toISOString(),
          payment_method: body.payment_method || null
        })
        .eq("id", pembelianId);
      if (updateErr) {
        return new Response("Supabase update error", { status: 500, headers: corsHeaders });
      }
      return new Response("OK (updated)", { status: 200, headers: corsHeaders });
    } else {
      // Insert ke tabel pembelian_kursus dengan field yang sesuai tabel
      const id_kursus = body.metadata?.id_kursus || null;
      const harga = body.amount || null;
      if (!user_uid || !id_kursus) {
      }
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

        return new Response("Supabase insert error", { status: 500, headers: corsHeaders });
      }
      return new Response("OK (inserted)", { status: 200, headers: corsHeaders });
    }
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

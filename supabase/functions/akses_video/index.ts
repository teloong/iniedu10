// Edge Function: akses_video
// Mengembalikan daftar video yang boleh diakses user berdasarkan pembelian kursus (user_uid dari Firebase)
// Kirimkan token Firebase lewat body POST { token: "..." }

// @ts-ignore
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Inisialisasi Supabase client
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
// @ts-ignore
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const token = body.token;
  const kelas = body.kelas;
  const mapel = body.mapel;
  if (!token) {
    return new Response(JSON.stringify({ error: "Token tidak ditemukan" }), {
      status: 400,
      headers: corsHeaders,
    });
  }
  if (!kelas || !mapel) {
    return new Response(JSON.stringify({ error: "Kelas dan mapel wajib dikirim" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Verifikasi token ke Firebase
  let uid;
  try {
    const response = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyAlxYWD4bCwpoKEErXDX1_4AZC9wzQTkwA`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });
    const result = await response.json();
    uid = result.users?.[0]?.localId;
    if (!uid) throw new Error("UID tidak ditemukan di token");
  } catch (err) {
    return new Response(JSON.stringify({ error: "Token Firebase tidak valid" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Query data pembelian user
  const { data: pembelian, error: errorPembelian } = await supabase
    .from("pembelian_kursus")
    .select("id_kursus")
    .eq("user_uid", uid);

  
  

  if (errorPembelian) {
    return new Response(JSON.stringify({ error: errorPembelian.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  const idKursus = pembelian.map(p => p.id_kursus).filter(id => !!id && id !== '').map(id => Number(id));
  

  let videos = [];
  if (idKursus.length > 0) {
    const { data: videoData, error: errorVideo } = await supabase
      .from("videos")
      .select("*")
      .in("id_kursus", idKursus)
      .eq("kelas", kelas)
      .eq("mapel", mapel);

    

    if (errorVideo) {
      return new Response(JSON.stringify({ error: errorVideo.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
    videos = videoData;
  }

  return new Response(JSON.stringify({ videos }), {
    status: 200,
    headers: corsHeaders,
  });
});

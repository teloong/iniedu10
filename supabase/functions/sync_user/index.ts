// Edge Function: sync_user
// Sinkronisasi user Firebase ke tabel users Supabase dengan verifikasi JWT
// Kirimkan Firebase ID Token lewat body POST { token: "..." }

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
  if (!token) {
    return new Response(JSON.stringify({ error: "Token tidak ditemukan" }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Verifikasi token ke Firebase
  let userData;
  try {
    const response = await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=AIzaSyAlxYWD4bCwpoKEErXDX1_4AZC9wzQTkwA`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    });
    const result = await response.json();
    userData = result.users?.[0];
    if (!userData) throw new Error("User data tidak ditemukan di token");
  } catch {
    return new Response(JSON.stringify({ error: "Token Firebase tidak valid" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  // Upsert ke tabel users
  const { localId: uid, email, displayName } = userData;
  const nama = displayName || (email?.split("@")[0]) || "-";
  const { error } = await supabase
    .from("users")
    .upsert([{ uid, email, display_name: nama }], { onConflict: ["uid"] });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: corsHeaders,
  });
});
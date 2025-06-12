import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Helper: CORS response
function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Helper: Validasi admin (JWT Supabase)
async function validateAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  console.log("[validateAdmin] Authorization header:", authHeader);
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  console.log("[validateAdmin] SUPABASE_URL:", supabaseUrl);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("[validateAdmin] Tidak ada Authorization header yang valid.");
    return { error: "Unauthorized", status: 401 };
  }
  const jwt = authHeader.replace("Bearer ", "");
  let verifyRes;
  try {
    verifyRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        "Authorization": `Bearer ${jwt}`,
        "apikey": Deno.env.get("SUPABASE_ANON_KEY") || ""
      }
    });
    console.log("[validateAdmin] /auth/v1/user status:", verifyRes.status);
  } catch (e) {
    console.log("[validateAdmin] ERROR fetch /auth/v1/user:", e);
    return { error: "Gagal verifikasi token: " + e, status: 500 };
  }
  if (!verifyRes.ok) {
    let errorText = await verifyRes.text();
    console.log("[validateAdmin] /auth/v1/user NOT OK, status:", verifyRes.status, "body:", errorText);
    return { error: "Token tidak valid", status: 401 };
  }
  let userInfo = {};
  try {
    userInfo = await verifyRes.json();
    console.log("[validateAdmin] userInfo:", userInfo);
  } catch (e) {
    console.log("[validateAdmin] ERROR parsing userInfo JSON:", e);
    return { error: "Gagal parsing user info", status: 500 };
  }
  const ADMIN_EMAIL = "lemindes@gmail.com";
  if (userInfo.email !== ADMIN_EMAIL) {
    console.log("[validateAdmin] Email bukan admin:", userInfo.email);
    return { error: "Hanya admin yang boleh mengelola blog", status: 403 };
  }
  console.log("[validateAdmin] ADMIN VERIFIED:", userInfo.email);
  return { userInfo };
}

// Handler utama
serve(async (req) => {
  // Handler CORS preflight (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  // Validasi admin dulu
  const adminCheck = await validateAdmin(req);
  if (adminCheck.error) return jsonResponse({ error: adminCheck.error }, adminCheck.status);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body = {};
  try {
    body = await req.json();
  } catch (e) {}

  // Routing method
  if (req.method === "POST") {
    // INSERT blog
    const { title, author, content, image, source } = body;
    if (!title || !author || !content) {
      return jsonResponse({ error: "Title, author, dan content wajib diisi" }, 400);
    }
    const { data, error } = await supabase
      .from("blog")
      .insert([{ title, author, content, image, source }]);
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ data });
  } else if (req.method === "PUT") {
    // UPDATE blog
    const { id, title, author, content, image, source } = body;
    if (!id) return jsonResponse({ error: "ID blog wajib diisi" }, 400);
    const updateData: any = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (content) updateData.content = content;
    if (image) updateData.image = image;
    if (source) updateData.source = source;
    const { data, error } = await supabase
      .from("blog")
      .update(updateData)
      .eq("id", id);
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ data });
  } else if (req.method === "DELETE") {
    // DELETE blog
    const { id } = body;
    if (!id) return jsonResponse({ error: "ID blog wajib diisi" }, 400);
    const { data, error } = await supabase
      .from("blog")
      .delete()
      .eq("id", id);
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ data });
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});

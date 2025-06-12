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
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

  } catch (e) {

    return { error: "Gagal verifikasi token: " + e, status: 500 };
  }
  if (!verifyRes.ok) {
    let errorText = await verifyRes.text();

    return { error: "Token tidak valid", status: 401 };
  }
  type UserInfo = { email?: string; [key: string]: any };
  let userInfo: UserInfo = {};
  try {
    userInfo = await verifyRes.json();

  } catch (e) {

    return { error: "Gagal parsing user info", status: 500 };
  }
  const ADMIN_EMAIL = "lemindes@gmail.com";
  if (!userInfo.email || userInfo.email !== ADMIN_EMAIL) {

    return { error: "Hanya admin yang boleh mengelola blog", status: 403 };
  }

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

  let body: {
    id?: string;
    title?: string;
    author?: string;
    author_role?: string;
    author_photo?: string;
    content?: string;
    image?: string;
    source?: string;
  } = {};
  try {
    body = await req.json();
  } catch (e) {}

  // Routing method
  if (req.method === "POST") {
    // INSERT blog
    const { title, author, author_role, author_photo, content, image, source } = body;
    if (!title || !author || !content) {
      return jsonResponse({ error: "Title, author, dan content wajib diisi" }, 400);
    }
    const { data, error } = await supabase
      .from("blog")
      .insert([{ title, author, author_role, author_photo, content, image, source }]);
    if (error) return jsonResponse({ error: error.message }, 400);
    return jsonResponse({ data });
  } else if (req.method === "PUT") {
    // UPDATE blog
    const { id, title, author, author_role, author_photo, content, image, source } = body;
    if (!id) return jsonResponse({ error: "ID blog wajib diisi" }, 400);
    const updateData: any = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (author_role) updateData.author_role = author_role;
    if (author_photo) updateData.author_photo = author_photo;
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

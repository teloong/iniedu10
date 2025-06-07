import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  let body;
try {
  body = await req.json();
} catch (e) {
  body = { error: "Failed to parse JSON body" };
}
console.log("[DEBUG] Body create_invoice:", body);

const { name, email, amount, nama_kursus } = body;
console.log("[DEBUG] name:", name);
console.log("[DEBUG] email:", email);
console.log("[DEBUG] amount:", amount);
console.log("[DEBUG] nama_kursus:", nama_kursus);

if (!nama_kursus) {
  console.log("[WARNING] nama_kursus kosong, fallback ke 'Pembayaran IniEdu'");
}
if (!name) {
  console.log("[WARNING] name (nama_lengkap) kosong!");
}
  const XENDIT_SECRET_KEY = Deno.env.get("XENDIT_SECRET_KEY");

  console.log("DEBUG XENDIT_SECRET_KEY (first 8 chars):", XENDIT_SECRET_KEY ? XENDIT_SECRET_KEY.slice(0,8) : "undefined");
  console.log("DEBUG req body:", { name, email, amount, nama_kursus });

  const response = await fetch("https://api.xendit.co/v2/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + btoa(XENDIT_SECRET_KEY + ":"),
    },
    body: JSON.stringify({
      external_id: "order-" + Date.now(),
      payer_email: email,

      description: nama_kursus || "Pembayaran IniEdu", // hanya nama kursus
      metadata: {
        nama_kursus: nama_kursus || "Pembayaran IniEdu",
        nama_lengkap: name || ""
      },
      amount: amount,
      success_redirect_url: "http://localhost:4321/sukses"
    }),
  });

  console.log("DEBUG Xendit response status:", response.status);

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = { error: await response.text() };
  }

  console.log("DEBUG Xendit response body:", data);

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    },
  });
});

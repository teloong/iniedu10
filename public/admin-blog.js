// File: public/admin-blog.js
// Handler & TinyMCE init eksternal untuk halaman admin-blog

// Inisialisasi TinyMCE untuk judul dan konten blog
document.addEventListener("DOMContentLoaded", function () {
  if (window.tinymce) {
    // Judul Blog (toolbar minimal)
    tinymce.init({
      selector: "#blog-title",
      menubar: false,
      height: 50,
      toolbar: "bold italic underline | removeformat",
      placeholder: "Judul Blog",
      branding: false,
      statusbar: false,
      plugins: [],
      content_style: "body { font-family:Inter,sans-serif; font-size:20px; font-weight:bold }"
    });
    // Isi Blog (toolbar lengkap)
    tinymce.init({
      selector: "#blog-content",
      height: 300,
      menubar: "file edit view insert format tools table help",
      plugins: [
        "advlist",
        "autolink",
        "lists",
        "link",
        "image",
        "charmap",
        "preview",
        "anchor",
        "help",
        "wordcount"
      ],
      toolbar:
        "undo redo | fontselect fontsizeselect | formatselect | bold italic underline strikethrough forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | link image | code fullscreen",
      content_style:
        "body { font-family:Inter,sans-serif; font-size:14px }",
    });
  }
});

// Supabase & handler form blog
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
const supabaseUrl = "https://jcfizceoycwdvpqpwhrj.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjZml6Y2VveWN3ZHZwcXB3aHJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NzUzNzUsImV4cCI6MjA2NDE1MTM3NX0.Au9FzSYvpaX7SkaVrgJvIgK9fZu5Dq4cU_NI5iwY6aA";
const supabase = createClient(supabaseUrl, supabaseKey);
const edgeUrl =
  "https://jcfizceoycwdvpqpwhrj.functions.supabase.co/insert_blog"; // Ganti jika endpoint berubah

let editingId = null;

(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || session.user.email !== "lemindes@gmail.com") {
    window.location.href = "/admin-login";
    return;
  }

  // Prefill form jika mode edit
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("edit");
  if (editingId) {
    const { data, error } = await supabase
      .from("blog")
      .select("*")
      .eq("id", editingId)
      .single();
    if (!error && data) {
      // Prefill judul blog (TinyMCE), tunggu hingga editor siap
      function prefillTitleTinyMCE() {
        if (window.tinymce && tinymce.get('blog-title')) {
          tinymce.get('blog-title').setContent(data.title || "");
        } else {
          setTimeout(prefillTitleTinyMCE, 100);
        }
      }
      prefillTitleTinyMCE();
      // Prefill isi blog (TinyMCE), tunggu hingga editor siap
      function prefillContentTinyMCE() {
        if (window.tinymce && tinymce.get('blog-content')) {
          tinymce.get('blog-content').setContent(data.content || "");
        } else {
          setTimeout(prefillContentTinyMCE, 100);
        }
      }
      prefillContentTinyMCE();
      // Prefill field lain
      document.getElementById("blog-author").value = data.author || "";
      document.getElementById("blog-author-role").value = data.author_role || "";
      document.getElementById("blog-author-photo").value = data.author_photo || "";
      document.getElementById("blog-image").value = data.image || "";
      document.getElementById("blog-source").value = data.source || "";
    }
  }

  // Submit handler
  document.getElementById("blog-form").onsubmit = async function (e) {
    e.preventDefault();
    // Ambil judul blog tanpa HTML dari TinyMCE judul
    let title = "";
    if (window.tinymce && tinymce.get('blog-title')) {
      title = tinymce.get('blog-title').getContent({ format: 'text' }).trim();
    } else {
      title = "";
    }
    // Ambil isi blog (boleh HTML) dari TinyMCE isi
    let content = "";
    if (window.tinymce && tinymce.get('blog-content')) {
      content = tinymce.get('blog-content').getContent();
    } else {
      content = "";
      content = document.getElementById("blog-content").value.trim();
    }
    const author = document.getElementById("blog-author").value.trim();
    const author_role = document
      .getElementById("blog-author-role")
      .value.trim();
    const author_photo = document
      .getElementById("blog-author-photo")
      .value.trim();
    const image = document.getElementById("blog-image").value.trim();
    const source = document.getElementById("blog-source").value.trim();
    const alertBox = document.getElementById("blog-success-alert");
    alertBox.classList.add("hidden");
    if (!title || !content || !author) {
      alertBox.textContent = "Judul, penulis, dan isi blog wajib diisi";
      alertBox.classList.remove("hidden");
      alertBox.classList.add("text-red-600");
      return;
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      alertBox.textContent = "Session login admin tidak ditemukan!";
      alertBox.classList.remove("hidden");
      alertBox.classList.add("text-red-600");
      return;
    }
    let method = editingId ? "PUT" : "POST";
    let payload = editingId
      ? {
          id: editingId,
          title,
          content,
          author,
          author_role,
          author_photo,
          image,
          source,
        }
      : { title, content, author, author_role, author_photo, image, source };
    let res, resJson;
    try {
      res = await fetch(edgeUrl, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      resJson = await res.json();
      if (!res.ok) {
        alertBox.textContent =
          "Gagal menyimpan blog: " +
          (resJson && resJson.error ? resJson.error : res.status);
        alertBox.classList.remove("hidden");
        alertBox.classList.add("text-red-600");
        ("[Blog Submit] Backend error:", resJson);
        return;
      }
      if (resJson && resJson.error) {
        alertBox.textContent = "Gagal menyimpan blog: " + resJson.error;
        alertBox.classList.remove("hidden");
        alertBox.classList.add("text-red-600");
       ("[Blog Submit] Backend error:", resJson);
        return;
      }
      alertBox.textContent = editingId
        ? "Artikel berhasil diubah!"
        : "Artikel berhasil ditambah!";
      alertBox.classList.remove("hidden");
      alertBox.classList.remove("text-red-600");
      // Reset judul blog (TinyMCE)
      if (window.tinymce && tinymce.get('blog-title')) {
        tinymce.get('blog-title').setContent('');
        // Trigger event supaya UI TinyMCE update
        tinymce.get('blog-title').fire('change');
        tinymce.get('blog-title').fire('blur');
      }
      // Reset isi blog (TinyMCE)
      if (window.tinymce && tinymce.get('blog-content')) {
        tinymce.get('blog-content').setContent('');
      }
      alertBox.classList.add("text-green-600");
      if (!editingId) document.getElementById("blog-form").reset();
    } catch (err) {
      alertBox.textContent = "Gagal menghubungi server: " + err;
      alertBox.classList.remove("hidden");
      alertBox.classList.add("text-red-600");
      ("[Blog Submit] Network/JS error:", err);
      return;
    }
  };

  // Sembunyikan alert jika user mulai mengetik lagi
  [
    "blog-title",
    "blog-content",
    "blog-author",
    "blog-image",
    "blog-source",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
      document.getElementById("blog-success-alert").classList.add("hidden");
    });
  });
})();

// Import modul upload Cloudinary modular
defineImportCloudinary();

function defineImportCloudinary() {
  import("/cloudinary-upload.js").then(mod => {
    mod.setupCloudinaryUpload(
      "blog-author-photo-file",
      "blog-author-photo",
      "dr8gr1uy1",
      "foto-penulis"
    );
  });
}

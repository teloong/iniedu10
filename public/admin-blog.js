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


// Handler form blog ke backend PHP
let editingId = null;

// Prefill form jika mode edit (ambil data dari URL param, fetch ke blog.php)
document.addEventListener("DOMContentLoaded", function () {
  const params = new URLSearchParams(window.location.search);
  editingId = params.get("id"); // Ganti dari 'edit' ke 'id'
  if (editingId) {
    // Ubah teks tombol submit
    const submitButton = document.querySelector('#blog-form button[type="submit"]');
    if(submitButton) submitButton.textContent = 'Update Artikel';

    const token = localStorage.getItem('adminAuthToken');
    fetch(`https://iniedu.id/admin_blog.php?id=${editingId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
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
      });
  }

  // Handler submit form
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
      content = document.getElementById("blog-content").value.trim();
    }
    const author = document.getElementById("blog-author").value.trim();
    const author_role = document.getElementById("blog-author-role").value.trim();
    const author_photo = document.getElementById("blog-author-photo").value.trim();
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
    let payload = editingId
      ? {
          action: "update",
          id: editingId,
          title,
          content,
          author,
          author_role,
          author_photo,
          image,
          source
        }
      : {
          action: "insert",
          title,
          content,
          author,
          author_role,
          author_photo,
          image,
          source
        };
    let method = editingId ? "PUT" : "POST";
    let url = editingId ? `https://iniedu.id/admin_blog.php?id=${editingId}` : "https://iniedu.id/admin_blog.php";
    let res, resJson;
    try {
      const token = localStorage.getItem('adminAuthToken');
      res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      resJson = await res.json();
      if (!res.ok) {
        alertBox.textContent =
          "Gagal menyimpan blog: " +
          (resJson && resJson.error ? resJson.error : res.status);
        alertBox.classList.remove("hidden");
        alertBox.classList.add("text-red-600");
        return;
      }
      if (resJson && resJson.error) {
        alertBox.textContent = "Gagal menyimpan blog: " + resJson.error;
        alertBox.classList.remove("hidden");
        alertBox.classList.add("text-red-600");
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
});

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

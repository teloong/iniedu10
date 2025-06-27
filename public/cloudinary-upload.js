// public/cloudinary-upload.js
export function setupCloudinaryUpload(inputId, outputId, cloudName, preset) {
  const fileInput = document.getElementById(inputId);
  if (fileInput) {
    fileInput.addEventListener("change", async function (e) {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", preset);
      // Optional: tampilkan loading
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (data.secure_url) {
        document.getElementById(outputId).value = data.secure_url;
        alert("Upload foto berhasil!");
      } else {
        alert("Upload gagal: " + (data.error?.message || "Unknown error"));
      }
    });
  }
}

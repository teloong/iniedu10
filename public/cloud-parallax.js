// cloud-parallax.js
// Efek parallax/interaktif awan mengikuti gerakan mouse

document.addEventListener('DOMContentLoaded', function () {
  // Pilih semua SVG motif awan utama
  const clouds = document.querySelectorAll('.awan-3d');
  if (!clouds.length) return;

  // Section target
  const section = document.getElementById('motif-awan');
  if (!section) return;

  section.addEventListener('mousemove', function (e) {
    const rect = section.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = (x / rect.width - 0.5) * 2; // -1 (kiri) s/d 1 (kanan)
    const percentY = (y / rect.height - 0.5) * 2;

    clouds.forEach((cloud, i) => {
      // Set kecepatan/parallax berbeda tiap awan
      const speed = 10 + i * 5;
      cloud.style.transform = `translate3d(${percentX * speed}px, ${percentY * speed}px, 0)`;
    });
  });

  section.addEventListener('mouseleave', function () {
    clouds.forEach(cloud => {
      cloud.style.transform = '';
    });
  });
});

# TaskManagement

Aplikasi web manajemen tugas (*Task Management*) dengan pembagian peran **Admin** dan **User**, dilengkapi dashboard statistik, grafik status & prioritas tugas, serta pemantauan aktivitas user dan task.

## Struktur Project

- `backend/` — Server, API endpoint, autentikasi JWT, dan koneksi database.
- `frontend/` — Antarmuka web (HTML, CSS, JavaScript) untuk halaman Admin dan User.

## Fitur Utama

- **Autentikasi & Role-Based Access:** Login berbasis JWT dengan pemisahan akses **Admin** dan **User**.
- **Admin Dashboard:** Menampilkan ringkasan jumlah task (*Total*, *To Do*, *In Progress*, *Completed*), grafik status & prioritas tugas menggunakan Chart.js, serta daftar user dan task terbaru (status task bersifat *read-only* bagi admin).
- **Manajemen Data:** Pengelolaan akun user serta pemantauan tugas di seluruh sistem.

## Cara Menjalankan Project

1. **Clone repository**
   ```bash
   git clone [https://github.com/Abdlz4kii/TaskManagement.git](https://github.com/Abdlz4kii/TaskManagement.git)
   cd TaskManagement
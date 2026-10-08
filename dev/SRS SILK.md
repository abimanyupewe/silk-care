**\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_**  
**Software Requirements Specification**

**for**

**Website SILK (Sistem Informasi Layanan Kesehatan)**

**Version 1.0**

**Prepared by :**  
**Yola Pratika**  
**Abimanyu Priyo Widagdo**  
**Mochamad Surya Rafliansyah**

**Oktober 2025**

**Table of Contents**

1. **Pendahuluan**

**1.1 Tujuan Penulisan Dokumen**  
**1.2 Audiens dan Pembaca yang Dituju**  
**1.3 Ruang Lingkup Sistem**  
**1.4 Definisi, Akronim, dan Singkatan**  
**1.5 Referensi**

2. **Deskripsi Umum**

**2.1 Perspektif Produk**  
**2.2 Fungsi Produk**  
**2.3 Karakteristik Pengguna**  
**2.4 Batasan-batasan**  
**2.5 Asumsi dan Ketergantungan**

3. **Spesifikasi Kebutuhan**  
   **3.1 Kebutuhan Fungsional**  
   **3.2 Kebutuhan Antarmuka Pengguna**   
   **3.3 Kebutuhan Antarmuka Eksternal**  
   **3.4 Kebutuhan Non-Fungsional**  
4. **Perancangan Sistem (System Design / OOP Design)**  
   **4.1 Use Case Diagram**  
   **4.2 Class Diagram**  
   **4.3 Sequence Diagram**  
   **4.4 Business Flow Diagram**  
     
     
     
     
     
     
     
     
     
     
   

1. **Pendahuluan**

**1.1 Tujuan Penulisan Dokumen**  
Dokumen ini merupakan Software Requirement Spesification (SRS) bertujuan untuk mendefinisikan secara lengkap kebutuhan perangkat lunak **SILK (Sistem Informasi Layanan Kesehatan)**.  
SRS ini menjadi dasar bagi tim pengembang, desaine r, dan stakeholder dalam proses perancangan, pengembangan, implementasi, serta pengujian sistem agar hasil yang dibangun sesuai kebutuhan bisnis dan pengguna.

**1.2 Audiens dan Pembaca yang Dituju**  
Dokumen ini ditujukan untuk:

* **Tim Pengembang (Developer):** memahami alur kerja sistem dan integrasi teknis.  
* **Tim UI/UX Designer:** merancang antarmuka yang efisien dan mudah digunakan.  
* **Stakeholder Internal:** memantau kesesuaian fitur dengan tujuan bisnis.  
* **Investor dan Mitra Bisnis:** menilai potensi bisnis dan kelayakan teknis.  
* **Evaluator Akademik:** meninjau struktur fungsional sistem dan kelengkapannya.


**1.3 Ruang Lingkup Sistem**  
SILK adalah **sistem informasi berbasis web** yang berfokus pada penyediaan data dan informasi mengenai layanan kesehatan, lokasi, harga, tenaga medis, dan fasilitas.  
Fokus utama sistem meliputi:

1. Menyediakan **informasi biaya dan layanan** yang transparan di sektor kesehatan.  
2. Menjadi **media promosi digital** bagi tenaga medis dan fasilitas kesehatan, khususnya dokter muda dan rumah sakit swasta.  
3. Menyediakan **fitur pencarian & perbandingan layanan** berdasarkan kategori, lokasi, dan biaya.  
4. Menyediakan **modul marketplace apotek**, tempat mitra apotek dapat menjual obat dan produk kesehatan secara legal.  
5. Menyediakan **AI Chat informatif**, yang membantu pasien mengenali keluhan dan merekomendasikan dokter atau fasilitas yang sesuai (tanpa diagnosis langsung).

Pada tahap awal, SILK dikembangkan dalam bentuk **website MVP (Minimum Viable Product)**. Versi mobile app akan dibuat setelah sistem stabil dan memiliki pengguna aktif.

**1.4 Definisi, Akronim, dan Singkatan**

1. SILK: Sistem Informasi Layanan Kesehatan  
2. MVP: Minimum Viable Product – versi awal produk  
3. AI: Artificial Intelligence (Kecerdasan Buatan)  
4. API: Application Programming Interface  
5. OTP: One-Time Password  
6. HKI: Hak Kekayaan Intelektual

**1.5 Referensi**

* IEEE Std 830-1998: Recommended Practice for Software Requirements Specification  
* Undang-Undang No. 29 Tahun 2004 tentang Praktik Kedokteran  
* Permenkes No. 24 Tahun 2022 tentang Rekam Medis Elektronik  
* Referensi aplikasi: Halodoc, Alodokter, KlikDokter, Satu Sehat


**2\. Deskripsi Umum**  
**2.1 Perspektif Produk**  
SILK merupakan sistem informasi layanan kesehatan berbasis web yang dikembangkan untuk menyediakan akses data yang terintegrasi, akurat, dan transparan mengenai fasilitas, layanan, serta biaya dalam sektor kesehatan. Sistem ini berfungsi sebagai pusat informasi (*information hub*) yang menghubungkan masyarakat dengan penyedia layanan kesehatan, seperti dokter, klinik, laboratorium, apotek, rumah duka, dan fisioterapis.  
SILK dirancang tidak untuk menggantikan layanan medis atau proses diagnosis, melainkan sebagai sarana pendukung pengambilan keputusan berbasis informasi (*informed decision-making*) bagi pengguna dalam memilih layanan kesehatan yang sesuai dengan kebutuhan dan kemampuan finansial mereka.  
Secara arsitektur, SILK terdiri atas dua komponen utama:

1. **Modul Informasi Utama**, yang menyajikan data terstruktur mengenai layanan, biaya, dan fasilitas kesehatan, termasuk profil tenaga medis dan lembaga terkait.  
2. **Modul Marketplace Apotek**, yang memberikan ruang khusus bagi apotek mitra resmi untuk melakukan aktivitas perdagangan obat dan produk kesehatan secara daring sesuai regulasi yang berlaku.

Untuk mendukung integrasi dan perluasan fungsi, SILK memanfaatkan beberapa layanan eksternal (Application Programming Interface / API), meliputi:

* OpenAI API, untuk mendukung fitur *AI Chat* yang membantu pengguna mengenali keluhan awal dan memberikan rekomendasi jenis layanan atau dokter spesialis terkait,  
* Midtrans API, untuk memfasilitasi proses transaksi digital pada modul marketplace apotek.  
* Google Maps API, untuk menampilkan informasi lokasi fasilitas kesehatan dan apotek terdekat.

Dengan desain tersebut, SILK berperan sebagai sistem informasi terintegrasi dengan kemampuan transaksi terbatas, yang mengedepankan transparansi, keamanan data, dan kemudahan akses bagi seluruh pengguna dalam ekosistem layanan kesehatan.

**2.2 Fungsi Produk**  
Aplikasi **SILK (Sistem Informasi Layanan Kesehatan)** digunakan oleh berbagai pihak di ekosistem layanan kesehatan, termasuk **masyarakat atau pasien**, **tenaga medis dan fasilitas kesehatan**, serta **penyedia gaya hidup sehat**.  
Sistem ini menyediakan fitur inti sebagai berikut:

1. **Registrasi dan Autentikasi Pengguna**  
   Pendaftaran, login, dan manajemen akun bagi seluruh pengguna sistem.  
2. **Pencarian dan Pemfilteran Layanan Kesehatan**  
   Pencarian dokter, apotek, klinik, rumah sakit, laboratorium, dan layanan lain berdasarkan lokasi, kategori, dan biaya.  
3. **Profil dan Informasi Layanan**  
   Menampilkan detail fasilitas, tenaga medis, dan jadwal operasional.  
4. **Marketplace Apotek**  
   Menyediakan transaksi pembelian obat dan produk kesehatan dari apotek mitra resmi.  
5. **AI Chat Informasi**  
   Chatbot berbasis kecerdasan buatan (AI) yang memberikan rekomendasi dokter atau fasilitas sesuai keluhan pengguna.  
6. **Artikel dan Edukasi Kesehatan**  
   Konten edukatif untuk meningkatkan literasi dan kesadaran kesehatan masyarakat.  
7. **Rating dan Review Pengguna**  
   Sistem ulasan terhadap layanan dan tenaga medis dengan filter komentar negatif otomatis.  
8. **Notifikasi dan Riwayat Aktivitas**  
   Pemberitahuan otomatis serta pencatatan transaksi, konsultasi, dan aktivitas pengguna.  
9. **Panel Admin dan Manajemen Sistem**  
   Akses khusus untuk admin dalam mengelola data, memverifikasi mitra, dan memantau aktivitas sistem.

**2.3 Karakteristik Pengguna**  
Sistem SILK (Sistem Informasi Layanan Kesehatan) melibatkan berbagai jenis pengguna dengan kebutuhan dan tanggung jawab yang berbeda.Setiap kategori pengguna memiliki akses dan fungsi yang disesuaikan dengan perannya dalam ekosistem layanan kesehatan digital.

| Kategori Pengguna | Peran dalam Sistem | Akses dan Aktivitas Utama |
| :---- | :---- | :---- |
| Pasien / Masyarakat Umum | Pengguna utama SILK yang mencari informasi layanan kesehatan, membaca artikel edukasi, dan melakukan transaksi pembelian obat. | Melihat informasi harga, fasilitas, dan profil tenaga medis. Membaca artikel kesehatan. Menggunakan AI Chat untuk mengenali keluhan awal dan rekomendasi dokter. Melakukan pembelian obat melalui apotek mitra. Mengakses riwayat pembelian, konsultasi, dan rekam medis pribadi |
| Tenaga Medis & Fasilitas Kesehatan (dokter, klinik, rumah sakit, laboratorium, fisioterapis, radiologi, dan rumah duka) | Penyedia informasi dan edukasi kesehatan (bukan pelaku transaksi). | Membuat dan memperbarui profil layanan (lokasi, jadwal, fasilitas). Mengunggah video profil atau video perkenalan untuk memperkenalkan diri atau layanan secara visual. Menulis artikel dan konten edukatif. Melihat ulasan dan rating pengguna. Dokter dapat mengakses rekam medis pasien yang terhubung dengannya guna mendukung konsultasi lanjutan. |
| Penyedia Gaya Hidup Sehat | Penyedia layanan kesehatan profesional non-dokter (psikolog, ahli gizi, catering sehat, wellness). | Membuat dan memperbarui profil layanan. Mengunggah video profil atau video perkenalan untuk memperkenalkan diri atau layanan secara visual. Menampilkan informasi program kesehatan dan gaya hidup. Menulis artikel edukasi. Menerima rating dan ulasan dari pengguna. |
| Apotek Mitra | Pelaku utama dalam marketplace SILK untuk transaksi produk kesehatan dan obat. | Mengelola stok, harga, dan informasi produk. Menerima dan memproses pesanan obat. Melihat riwayat transaksi. Terhubung dengan pasien melalui sistem pesanan. |
| Administrator SILK | Pengelola utama sistem dan pengawas integritas data | Verifikasi akun tenaga medis dan apotek. Mengelola database, artikel, dan keamanan sistem. Memoderasi ulasan serta memantau aktivitas pengguna. |

**2.4 Batasan-batasan**

1. Fokus awal (MVP) hanya pada versi website.  
2. Cakupan geografis terbatas pada kota Malang dan sekitarnya.  
3. Timeline pengembangan menyesuaikan hasil evaluasi dan kesiapan sistem.  
4. Fitur transaksi hanya berlaku untuk apotek mitra resmi.  
5. SILK tidak menyediakan diagnosis medis atau konsultasi klinis darurat.  
6. Sistem memerlukan koneksi internet aktif untuk diakses.  
7. Database dikelola penuh oleh admin SILK guna menjaga keamanan dan integritas data.

**2.5 Asumsi dan Ketergantungan**

1. Penyedia layanan kesehatan (Mitra) bersedia berpartisipasi dalam model promosi dan transaksi digital.  
2. Masyarakat bersedia memberikan ulasan dan informasi untuk menciptakan transparansi layanan.  
3. Pengguna memiliki perangkat dengan browser modern dan koneksi internet stabil.  
4. API eksternal seperti OpenAI, Midtrans, dan Google Maps berfungsi dengan baik.  
5. Data fasilitas, harga, dan layanan diperbarui secara berkala oleh admin dan mitra resmi.  
6. Mitra apotek serta fasilitas kesehatan memiliki izin operasional yang sah.  
7. Sistem bergantung pada server cloud (AWS atau setara) untuk hosting dan penyimpanan data.  
8. Ketersediaan sumber daya manusia (tim inti) serta dukungan dari pihak ketiga menjadi faktor penting dalam kelangsungan pengembangan SILK**.**

**3\. Spesifikasi Kebutuhan**  
Bagian ini menjelaskan kebutuhan fungsional, antarmuka, dan integrasi eksternal yang harus dipenuhi oleh sistem SILK (Sistem Informasi Layanan Kesehatan) untuk mendukung seluruh aktivitas pengguna dan memastikan kinerja sistem berjalan sesuai tujuan bisnis.  
**3.1 Kebutuhan Fungsional**  
Kebutuhan fungsional menggambarkan fitur utama dan perilaku sistem yang harus disediakan oleh SILK. Tabel berikut menjelaskan fungsi utama sistem berdasarkan peran pengguna dan modul yang tersedia

| Kode | Nama Fitur / Modul | Deskripsi Fungsional | Aktor / Pengguna |
| :---- | :---- | :---- | :---- |
| F-01 | Autentikasi & Manajemen Pengguna | Sistem menyediakan fitur pendaftaran, login, dan manajemen akun untuk seluruh pengguna (pasien, dokter, fasilitas, apotek, admin). | Semua pengguna |
| F-02 | Manajemen Profil Layanan Kesehatan | Tenaga medis dan fasilitas dapat mengelola profilnya (foto, deskripsi, lokasi, jadwal praktik, video profil). | Dokter, fasilitas medis, penyedia gaya hidup sehat |
| F-03 | Pencarian & Pemfilteran Layanan | Pengguna dapat mencari tenaga medis, fasilitas, atau apotek berdasarkan kategori, lokasi, biaya, dan rating. | Pasien / masyarakat |
| F-04 | AI Chat Informasi Kesehatan | Sistem menyediakan chatbot berbasis AI untuk mengenali keluhan dan merekomendasikan dokter atau layanan terkait (tanpa diagnosis medis). | Pasien / masyarakat |
| F-05 | Artikel & Edukasi Kesehatan | Dokter dan penyedia layanan dapat menulis dan mengunggah artikel edukatif untuk publik. | Dokter, penyedia gaya hidup sehat |
| F-06 | Marketplace Apotek | Apotek mitra dapat menjual produk kesehatan dan obat; pengguna dapat melakukan pembelian dan pembayaran online. | Apotek, pasien |
| F-07 | Riwayat & Rekam Medis Digital | Sistem menyimpan riwayat transaksi, konsultasi, dan rekam medis pasien. Hanya dokter terkait dan pasien yang dapat mengakses data ini. | Pasien, dokter |
| F-08 | Rating & Ulasan Layanan | Pengguna dapat memberikan ulasan dan penilaian terhadap layanan dengan sistem penyaringan komentar negatif. | Pasien / masyarakat |
| F-09 | Notifikasi Sistem | Pengguna menerima notifikasi untuk aktivitas seperti transaksi, konfirmasi akun, pembaruan profil, dan informasi terbaru. | Semua pengguna |
| F-10 | Panel Admin & Manajemen Sistem | Admin dapat mengelola data pengguna, memverifikasi mitra, memoderasi ulasan, dan mengontrol aktivitas sistem. | Administrator |
| F-11 | Email Notifikasi | Sistem mengirimkan notifikasi email otomatis (verifikasi, reset password, konfirmasi transaksi). | Semua pengguna |

**3.2 Kebutuhan Antarmuka Pengguna**   
Kebutuhan interface menjelaskan tampilan dan interaksi antar pengguna dengan sistem. Antarmuka dirancang agar intuitif, mudah diakses, dan konsisten di seluruh platform (desktop & mobile browser).

| Antarmuka | Deskripsi Tampilan / Fungsi |
| :---- | :---- |
| Halaman Beranda | Menampilkan beranda marketplace dengan daftar layanan kesehatan dan apotek mitra. |
| Halaman Login & Registrasi | Formulir login/daftar untuk pengguna baru dan lama dengan validasi OTP/email. |
| Halaman Profil Layanan | Menampilkan profil tenaga medis/fasilitas lengkap dengan informasi layanan, video profil, dan ulasa |
| Halaman AI Chat | Area chat interaktif yang memanfaatkan OpenAI API untuk memberikan rekomendasi layanan. |
| Halaman Artikel Kesehatan | Menampilkan artikel, tips kesehatan, dan edukasi dari dokter serta penyedia gaya hidup sehat. |
| Halaman Marketplace Apotek | Menampilkan produk obat & kesehatan, fitur keranjang, serta proses checkout dengan Midtrans API. |
| Halaman Riwayat Pasien | Menampilkan riwayat transaksi, konsultasi, dan rekam medis pribadi. |
| Dashboard Admin | Panel kontrol admin untuk verifikasi mitra, pengelolaan data, dan pemantauan sistem. |

**3.3 Kebutuhan Antarmuka Eksternal**  
SILK menggunakan beberapa layanan eksternal untuk mendukung fungsi utama sistem. Tabel berikut menjelaskan integrasi API dan sistem eksternal yang digunakan.

| Jenis Antarmuka Eksternal | Nama / Teknologi | Fungsi Integrasi |
| :---- | :---- | :---- |
| Backend API | Strapi CMS | Mengelola database, konten, dan API utama untuk komunikasi antar modul. |
| Frontend Framework | Next.js | Mengembangkan antarmuka website dengan performa tinggi dan SEO-friendly. |
| Mobile Framework | Flutter | Digunakan untuk pengembangan aplikasi mobile di tahap lanjutan. |
| Payment Gateway API | Midtrans API | Menangani proses pembayaran digital pada marketplace apotek. |
| AI API | OpenAI API | Mendukung chatbot interaktif untuk rekomendasi layanan kesehatan. |
| Map API | Google Maps API | Menampilkan lokasi fasilitas kesehatan dan apotek mitra. |
| Email Notification API | SMTP / Gmail API | Mengirimkan notifikasi email (verifikasi akun, transaksi, dan notifikasi penting). |

**3.4 Kebutuhan Non-Fungsional**  
Kebutuhan non-fungsional menjelaskan standar kinerja, keamanan, dan kualitas sistem yang harus dipenuhi agar SILK berfungsi optimal.

| Aspek | Deskripsi Kebutuhan |
| :---- | :---- |
| Keamanan (Security) | Sistem wajib menggunakan enkripsi data (HTTPS, SSL) dan autentikasi aman (JWT, OTP). Akses data rekam medis dibatasi hanya untuk dokter & pasien terkait. |
| Kinerja (Performance) | Website harus mampu memuat halaman utama dalam ≤ 3 detik pada koneksi 10 Mbps. |
| Usability (Kemudahan Penggunaan) | Antarmuka harus intuitif dan dapat diakses oleh pengguna umum tanpa pelatihan khusus. |
| Compatibility | Sistem kompatibel dengan browser utama (Chrome, Edge, Safari, Firefox) dan perangkat mobile. |
| Scalability | Sistem dirancang agar mudah dikembangkan ke versi aplikasi mobile dan integrasi fitur baru. |
| Maintainability | Struktur kode modular (berbasis Strapi & Next.js) agar mudah diperbarui oleh tim pengembang. |
| Reliability (Keandalan) | Sistem harus memiliki uptime minimal 99% dan mampu memulihkan data otomatis dari backup harian. |
| Privacy (Kerahasiaan Data) | Seluruh data pribadi dan medis dilindungi sesuai standar Permenkes No. 24 Tahun 2022\. |

**4\. Perancangan Sistem (System Design / OOP Design)**  
**4.1 Use Case Diagram**

**4.2 Class Diagram**

**4.3 Sequence Diagram**

**4.4 Business Flow Diagram**


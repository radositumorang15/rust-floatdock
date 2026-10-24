# DESIGN.md — Float Dock (v0.2)

Spesifikasi Desain & Panduan Arsitektur Visual: **Liquid Glass**, **Spring Physics**, **Continuous Gaussian Magnification**, dan **Sistem Tema Modular "Grimoire"**.

---

## 1. Referensi Desain & Filosofi Visual

Float Dock v0.2 menggabungkan keunggulan visual dari beberapa desain sistem modern:

1. **Liquid Glass (Apple macOS / VisionOS)**:
   - Permukaan kaca transparan dengan *specular highlight* tajam di tepi atas (1px garis bias gradien).
   - Efek refraksi halus dengan *subtle tint* dan bayangan difus berlapis (*diffuse multi-stage shadow*).
   - Latar belakang blur dijaga **statis** (tidak dianimasikan) untuk mencegah *frame drop* GPU.
2. **Dynamic Island (Apple iOS)**:
   - Notch status bagian atas layar yang melebar secara organik menggunakan **spring physics**, bukan durasi linear kaku.
   - Dilengkapi ekspresi "mata" reaktif status (*idle blinking*, *timer completion pulse*, *media now playing*).
3. **Raycast / Arc Browser**:
   - Pencarian aplikasi pada Start Menu dengan hasil instan (0ms perceptible latency).
   - Transisi gerak singkat, kontras tajam, autofokus keyboard seketika, dan tipografi tegas.
4. **Seelen UI, Rainmeter, Wallpaper Engine**:
   - Sistem tema modular di mana pengguna dapat memasang *theme pack* kustom (`theme.json` + wallpaper + paket ikon + efek suara) tanpa harus mengompilasi ulang aplikasi.

---

## 2. Aturan Performa & Gerakan Halus (Silky Smooth 60–120 FPS)

Agar dock terasa sangat ringan dan mulus di Windows 10 dan Windows 11:

1. **Gunakan Spring Physics**:
   - Nilai token pegas: **Stiffness ≈ 300**, **Damping ≈ 26**, **Mass = 1.0**.
   - Kurva CSS representatif: `cubic-bezier(0.16, 1, 0.3, 1)` dengan timing pendek (180ms – 260ms).
2. **Animasikan Hanya `transform` dan `opacity`**:
   - Dilarang menganimasikan `backdrop-filter: blur(...)` atau `filter: blur(...)` saat kursor bergerak (hal ini penyebab utama lag pada DWM Windows).
   - Hindari menganimasikan dimensi `width` / `height` / `margin` pada dock item; gunakan `transform: translate3d(...) scale3d(...)` yang dieksekusi langsung pada layer *GPU Compositor*.
   - Setiap elemen interaktif diberi properti `will-change: transform`.
3. **Magnifikasi Kontinu Berbasis Jarak Gaussian**:
   - Pembesaran ikon dock tidak menggunakan sistem hover per-ikon (*discrete hover*), melainkan fungsi distribusi kurva Gaussian kontinu berdasarkan koordinat horizontal kursor mouse.
4. **FLIP Technique untuk Drag Reordering**:
   - Menggunakan prinsip *First, Last, Invert, Play* saat mengatur ulang urutan ikon aplikasi via drag-and-drop agar perpindahan posisi terjadi 60fps tanpa merekonstruksi DOM.
5. **Matikan Animasi Saat Dock Disembunyikan**:
   - Saat fitur *Auto-Hide* aktif dan dock berada di luar pandangan, seluruh *event listener mousemove* dan requestAnimationFrame dihentikan secara otomatis.

---

## 3. Rumus Magnifikasi Gaussian Kontinu

Ikon dock mengalami pembesaran dan elevasi halus secara bertahap saat kursor mouse bergerak di atas deretan ikon:

$$s(d) = 1.0 + A \cdot \exp\left(-\frac{d^2}{2\sigma^2}\right)$$
$$y(d) = -Y_{\max} \cdot \exp\left(-\frac{d^2}{2\sigma^2}\right)$$

### Parameter Fisika:
- **Amplitudo Skala ($A$)**: `0.35` (Maksimum perbesaran: 1.35x ukuran normal).
- **Standar Deviasi Jarak ($\sigma$)**: `65 px` (Menentukan seberapa lebar gelombang kurva mempengaruhi ikon tetangga).
- **Elevasi Vertikal ($Y_{\max}$)**: `10 px` (Ikon naik mendekati kursor mouse).
- **Jarak Relatif ($d$)**: $|X_{\text{cursor}} - X_{\text{icon\_center}}|$ dalam satuan piksel.
- **Di Luar Dock**: Jika kursor keluar dari area dock, $s = 1.0$ dan $y = 0\text{px}$ secara serentak.

```tsx
// Implementasi pada DockItem.tsx
const scale = mouseX === null 
  ? 1.0 
  : 1.0 + 0.35 * Math.exp(-Math.pow(distanceX, 2) / (2 * Math.pow(65, 2)));

const translateY = mouseX === null 
  ? 0 
  : -10 * Math.exp(-Math.pow(distanceX, 2) / (2 * Math.pow(65, 2)));
```

---

## 4. Design Tokens (v0.2)

```css
:root {
  /* Liquid Glass Palette */
  --glass-bg: rgba(45, 65, 95, 0.65);
  --glass-bg-strong: rgba(30, 48, 75, 0.82);
  --glass-border: rgba(255, 255, 255, 0.28);
  --glass-highlight: rgba(255, 255, 255, 0.45);
  --glass-specular: linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 40%, rgba(0,0,0,0.15) 100%);
  --glass-shadow: 0 16px 40px rgba(8, 18, 36, 0.45), 0 4px 12px rgba(8, 18, 36, 0.3);

  /* Surface Chips & Buttons */
  --surface-chip: rgba(255, 255, 255, 0.20);
  --surface-chip-hover: rgba(255, 255, 255, 0.32);
  --surface-chip-dark: rgba(18, 28, 46, 0.65);
  --input-bg: rgba(255, 255, 255, 0.16);
  --input-border: rgba(255, 255, 255, 0.38);

  /* Typography Colors */
  --text-primary: #FFFFFF;
  --text-secondary: rgba(255, 255, 255, 0.80);
  --text-placeholder: rgba(255, 255, 255, 0.60);
  --accent: #5B9BFF;
  --danger: #FF5A52;
  --notch-bg: #000000;

  /* Corner Radius */
  --r-dock: 22px;
  --r-menu: 24px;
  --r-icon: 12px;
  --r-chip: 14px;
  --r-input: 12px;
  --r-notch: 0 0 20px 20px;

  /* Spring Physics Timings */
  --spring-stiffness: 300;
  --spring-damping: 26;
  --ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
  --t-spring: 220ms;
  --t-fast: 160ms;
}
```

---

## 5. Sistem Tema Modular (Theme Pack Ecosystem)

### 5.1 Legalitas & Pemisahan Aset Pengguna
Untuk menjaga distribusi aplikasi bebas dari sengketa hak cipta:
1. **Tidak Ada Karakter atau Logo Berlisensi pada Build**: Kode sumber dan file binary bawaan **tidak** mendistribusikan gambar karakter resmi, musik berlisensi, atau logo berhak cipta anime pihak ketiga.
2. **Sistem Theme Pack Terbuka**: Aplikasi menyediakan direktori `%APPDATA%\FloatDock\themes\<nama-tema>\`. Pengguna dapat memasang aset sendiri (wallpaper anime favorit, ikon kustom, suara sihir) untuk pemakaian pribadi.
3. **Preset Bawaan "Grimoire"**: Menggunakan konsep sihir orisinal, motif semanggi geometris bebas lisensi, dan palet mana elemental.

### 5.2 Struktur Folder Theme Pack
```
%APPDATA%\FloatDock\themes\
└── Grimoire/
    ├── theme.json        # Berkas spesifikasi tema
    ├── wall.jpg          # Wallpaper desktop (opsional)
    ├── icons/            # Ikon kustom aplikasi (.svg/.png) (opsional)
    └── sounds/           # Efek suara klik / hover (.wav/.mp3) (opsional)
```

### 5.3 Spesifikasi Skema `theme.json`
```json
{
  "name": "Grimoire",
  "version": "1.0.0",
  "accent": "#7CFFB2",
  "manaAttribute": "wind",
  "glow": {
    "enabled": true,
    "flow": true,
    "color": "#7CFFB2"
  },
  "liquidGlass": {
    "enabled": true,
    "specular": true,
    "tint": "rgba(20, 42, 32, 0.75)"
  },
  "wallpaper": "wall.jpg",
  "startMenu": {
    "style": "pages",
    "cloverMotif": true
  },
  "notch": {
    "eyes": "custom",
    "eyesStyle": "mana-spark"
  },
  "particles": {
    "enabled": true,
    "onHover": "mana",
    "type": "mana"
  }
}
```

---

## 6. Preset Bawaan: "Grimoire" (Sihir Mana Orisinal)

Preset **"Grimoire"** menghadirkan estetika dunia fantasi sihir berkecepatan tinggi:

1. **Palet 6 Atribut Mana Elemental (Dapat Dipilih Pengguna)**:
   - 🍃 **Angin (Wind)**: `#7CFFB2` (Hijau Mana Zamrud)
   - 🔥 **Api (Fire)**: `#FF5757` (Merah Membara)
   - 💧 **Air (Water)**: `#5BE2FF` (Biru Laut Terang)
   - 🪨 **Bumi (Earth)**: `#E5B869` (Emas Keemasan)
   - ⚡ **Cahaya (Light)**: `#FFE66D` (Kuning Berpendar)
   - 🔮 **Kegelapan (Dark)**: `#A855F7` (Ungu Mistik)
2. **Border Mana Flow**:
   - Tepi dock membiaskan gradien cahaya mana yang mengalir halus secara melingkar (`animation: manaFlow 4s linear infinite`).
3. **Percikan Partikel Mana (`ManaParticles.tsx`)**:
   - Mengikuti pergerakan kursor mouse di sekitar dock item dengan partikel kilau berpendar halus.
4. **Pill Timer Lingkaran Mana (`Pill.tsx`)**:
   - Dihiasi cincin *mana circle* SVG yang terisi secara presisi berdasarkan persentase countdown sisa waktu.
5. **Start Menu Grimoire Shell (`StartMenu.tsx`)**:
   - Header grimoire dengan indikator atribut mana aktif, tab kategori lipatan halaman (*page fold feel*), dan motif semanggi geometris orisinal.
6. **Notch Island Reaktif Status (`Notch.tsx`)**:
   - Pasang "mata" berkedip lembut dengan pendaran aksen mana saat *idle*.
   - Saat timer selesai atau notifikasi masuk, notch melebar dengan animasi pegas menyala (*alert mana burst*).
7. **Motif Semanggi Geometris Orisinal (`CloverIcon.tsx`)**:
   - Representasi semanggi berbasis bentuk simetris 4-kelopak orisinal sebagai tombol menu pembuka Grimoire.

---

## 7. Start Menu (Perbaikan Tinggi & Tata Letak Bebas Potongan)

### 7.1 Spesifikasi Dimensi
- **Ukuran Jendela OS (`tauri.conf.json`)**: `368 px × 460 px` (Ditingkatkan dari 358 px agar baris ke-3 dan footer profil "Awal" tidak lagi terpotong).
- **Tinggi Kontainer Kartu**: `448 px`.
- **Posisi Layar**: Rata kiri dengan dermaga dock (`alignItems: flex-start`), 12 px di atas dock.

### 7.2 Anatomi Komponen (Atas ke Bawah)
1. **Header Tema**: Indikator clover motif dan nama atribut mana yang aktif.
2. **Pencarian Raycast/Arc**: Input pencarian seketika dengan pemfilteran real-time.
3. **Tab Kategori**: Pilihan *Semua, Sistem, Komunikasi, Media*.
4. **Grid Aplikasi (4 Kolom × 3 Baris)**: `max-height: 270px` dengan scroll vertikal otomatis jika item bertambah.
5. **Translucent Divider**: Garis pembatas tipis 1px.
6. **Footer Profil & Kontrol Daya**:
   - Sisi Kiri: Avatar pengguna "Awal" dengan badge status hijau.
   - Sisi Kanan: Tombol daya dengan opsi *Sleep, Restart, Lock, Sign out, Shut down*.

---

## 8. Eliminasi Artefak Visual (Grey Box Fix)

- **Masalah**: Penggunaan API DWM Acrylic (`window_vibrancy::apply_acrylic`) menerapkan warna latar belakang abu-abu pada seluruh batas kotak persegi HWND (termasuk di luar sudut melengkung `border-radius`).
- **Solusi Arsitektur**:
  1. Hapus pemanggilan `apply_acrylic` pada jendela dock dan menu.
  2. Pertahankan `transparent: true` pada `tauri.conf.json`.
  3. Gunakan alpha transparency per-pixel murni via CSS Liquid Glass (`--glass-bg`, `border-radius`).
  4. Hasil: Latar abu-abu persegi hilang total; hanya kapsul dock dan kartu menu yang melayang bersih di atas desktop.

---

## 9. Standarisasi Sistem Ikon & Micro-Parallax (v0.2)

### 9.1 Matriks Pilihan Gaya & Lisensi Komersial Bebas Atribusi

| Gaya | Hasil & Karakter | Sumber / Referensi | Lisensi |
|---|---|---|---|
| **3D / Fluent Emoji** | Paling modern dan "hidup", menyatu sempurna dengan Liquid Glass | Microsoft Fluent Emoji 3D (Iconify) | **MIT** (Bebas komersial) |
| **Fluent Color** | Berwarna, bersih, konsisten native Windows 11 | `fluent-color` (Iconify) | **MIT** (Bebas komersial) |
| **Duotone / Fill** | Ikon UI (Wi-Fi, volume, baterai, daya) yang elegan dan ringkas | Phosphor / Lucide | **MIT / ISC** (Bebas komersial) |
| **Garis Minimalis** | Simbol pencarian dan indikator navigasi | Lucide Icons | **ISC** (Bebas komersial) |

> [!NOTE]
> **Keputusan Lisensi Bebas CC BY 4.0**:
> FloatDock sengaja menghindari set ikon dengan lisensi *CC BY 4.0* (seperti Solar Icons) agar pengguna maupun pengembang bebas mendistribusikan atau mengomersialkan build tanpa kewajiban mencantumkan teks atribusi khusus di antarmuka pengguna.

### 9.2 Spesifikasi Ubin Squircle Seragam (`.squircle-icon-tile`)

Seluruh ikon aplikasi (bawaan maupun pihak ketiga) dibungkus dalam modul ubin squircle yang seragam:

1. **Highlight Spekular 1 px di Tepi Atas**:
   - Garis bias cahaya di sisi atas ubin:
     `background: linear-gradient(90deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.15) 100%)`.
2. **Gradien Kedalaman Dalam (Inner Depth Gradient 8–10%)**:
   - Lapisan semu kedalaman di dalam ubin:
     `background: linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 42%, rgba(0,0,0,0.12) 100%)`.
3. **Bayangan Difus Lembut Seragam**:
   - `box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25)`.
4. **Radius Sudut Squircle Konsisten**:
   - Menggunakan token `--r-icon: 12px` (dock: 44×44px, start menu: 40×40px).

### 9.3 Normalisasi Ikon Pihak Ketiga (Third-Party Normalization)

Aplikasi eksternal seperti Brave, Discord, VS Code, atau PureRef sering memiliki margin dan gaya visual berbeda. FloatDock menyeragamkannya melalui:
- **Normalisasi Padding**: Margin dalam 8 px konstan di dalam squircle untuk menjaga *optical weight* yang seimbang antar-aplikasi.
- **Mask Squircle Seragam**: Sudut lengkung yang sama pada semua tile aplikasi.
- **Latar Belakang Squircle Kontras**: Menggunakan ubin gradien berbobot atau `--surface-chip` untuk ikon berlatar transparan.
- **Bayangan Lembut Seragam**: Seluruh aplikasi memiliki bayangan elevasi `0 4px 10px rgba(0,0,0,0.25)` yang identik.

### 9.4 Efek Micro-Parallax Interaktif

Untuk menghadirkan sensasi sentuhan kedalaman fisik (taktil) seperti antarmuka visionOS / tvOS:
- Saat kursor mouse mendekati atau berada di atas ikon ($|X_{\text{cursor}} - X_{\text{icon}}| < 140\text{ px}$):
  $$\Delta x = \operatorname{clamp}\left(-2\text{px},\; \frac{X_{\text{cursor}} - X_{\text{icon}}}{80} \times 1.8,\; 2\text{px}\right)$$
  $$\Delta y = -1.2 \times \text{factor}$$
- Lapisan gambar di dalam (`.icon-glyph-parallax`) bergeser halus 1–2 px mengikuti arah kursor dengan transisi `140ms cubic-bezier(0.16, 1, 0.3, 1)`.

### 9.5 Sistem Icon Pack per Tema (`iconOverrides`)

Pengguna dan pembuat tema dapat memetakan atau mengganti ikon aplikasi apa pun melalui berkas `theme.json`:

```json
{
  "name": "Grimoire",
  "iconOverrides": {
    "explorer": "grimoire-scroll",
    "notes": "magic-quill",
    "music": "mana-harp",
    "discord": "telepathy-orb"
  }
}
```

Jika aplikasi mendeteksi kunci yang sesuai pada `theme.iconOverrides`, ikon bawaan secara otomatis digantikan oleh ikon kustom bertema yang ditentukan.

### 9.6 Standar Format Vektor SVG Murni

- Seluruh ikon dirender dalam format **SVG murni** (bukan bitmap PNG beresolusi tetap).
- Menjamin ketajaman 100% pada semua konfigurasi skala layar Windows (100%, 125%, 150%, 175%, hingga 200% DPI) tanpa distorsi atau pikselasi buram.


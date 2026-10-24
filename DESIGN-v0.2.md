# DESIGN.md v0.2 — Float Dock "Segmented Glass"

Menggantikan v0.1. Arah baru: **taskbar tersegmentasi** (tiap grup = pil kaca melayang dengan tint sendiri), gerak berbasis spring, sistem tema, dan latar parallax berlapis. Menu dan fungsi tetap sama dengan v0.1/PRD.

Ukuran dalam px logis (1080p, skala 100%). Kalikan dengan DPI scale.

---

## 1. Prinsip

1. **Segmen, bukan satu blok**: setiap grup fungsi adalah pil sendiri, dipisahkan celah transparan.
2. **Kaca berlapis**: blur → tint → highlight tepi → konten. Tepi menyala tipis (liquid glass).
3. **Satu gaya ikon**: seragam, bukan campuran.
4. **Gerak = spring**: tidak ada durasi kaku untuk interaksi utama.
5. **Tema adalah data**: warna, wallpaper, siluet, partikel, dan suara berasal dari `theme.json`.
6. **Hemat**: animasi hanya `transform` + `opacity`; dijeda saat tersembunyi/fullscreen.

## 2. Layout Dock Tersegmentasi

```
[Start] [ Timer | Apps ......................... ] [ Cuaca ] [ Tray ........ Jam ]
 tile    segmen A (tint = accent-1)                segmen B   segmen C (tint = accent-2)
```

| Segmen | Isi | Tint default |
|---|---|---|
| **Start** | Tile 52×52, ikon 4 kotak | `--tint-start` |
| **A — Apps** | Pill timer, separator, ikon pinned + berjalan | `--tint-apps` |
| **B — Cuaca** | Ikon + suhu | `--tint-info` |
| **C — Sistem** | Chevron, Wi-Fi, volume, baterai, separator, jam & tanggal | `--tint-system` |
| **Notif (ad hoc)** | Kartu notifikasi/media yang muncul di samping segmen A, tutup dengan ✕ | `--tint-notify` |

Ukuran & jarak:

| Properti | Nilai |
|---|---|
| Tinggi segmen | 60 (Start 52×52 sejajar tengah) |
| Padding dalam segmen | 8 vertikal, 10 horizontal |
| Celah antarsegmen | 10 |
| Jarak dock ke tepi bawah | 14 |
| Radius segmen | 20 (Start 16) |
| Posisi | tengah horizontal; Start di ujung kiri grup |

Aturan overflow (layar sempit): sembunyikan segmen B → ringkas segmen C (hanya jam + 3 ikon) → ikon app berlebih masuk chevron overflow.

### 2.1 Indikator ikon aktif
- Berjalan: titik 4 px putih di bawah ikon.
- Aktif/fokus: **bercak warna** (blob radial 56×56, blur 14, warna dominan ikon, opasitas 35%) di belakang ikon, ala gambar referensi, plus pill 14×4 `--accent`.
- Bercak berpindah antar ikon dengan spring (translateX), bukan muncul-hilang.

## 3. Token (CSS)

```css
:root {
  /* Tint segmen (diisi tema, ini default "Grimoire Verdant") */
  --tint-start:  rgba(40, 150, 110, 0.55);
  --tint-apps:   rgba(70, 40, 130, 0.55);
  --tint-info:   rgba(60, 60, 120, 0.50);
  --tint-system: rgba(40, 130, 105, 0.55);
  --tint-notify: rgba(100, 60, 170, 0.60);

  --accent: #7CFFB2;
  --accent-2: #9B7CFF;
  --glow: rgba(124, 255, 178, 0.45);

  /* Kaca */
  --glass-blur: 26px;
  --glass-saturate: 1.35;
  --glass-border: rgba(255,255,255,0.30);
  --glass-edge-top: rgba(255,255,255,0.55);     /* highlight spekular atas */
  --glass-edge-bottom: rgba(255,255,255,0.10);
  --glass-inner-shadow: inset 0 1px 0 var(--glass-edge-top), inset 0 -1px 0 var(--glass-edge-bottom);
  --glass-shadow: 0 14px 34px rgba(8, 10, 30, 0.38), 0 2px 8px rgba(8, 10, 30, 0.25);

  /* Teks */
  --text: #FFFFFF;
  --text-2: rgba(255,255,255,0.75);
  --text-shadow: 0 1px 2px rgba(0,0,0,0.35);

  /* Chip */
  --chip: rgba(255,255,255,0.20);
  --chip-hover: rgba(255,255,255,0.32);
  --chip-dark: rgba(15, 20, 40, 0.55);

  /* Radius */
  --r-seg: 20px; --r-tile: 16px; --r-icon: 13px; --r-chip: 14px;
  --r-menu: 26px; --r-input: 14px;

  /* Tipografi */
  --font: "Inter", "Segoe UI Variable", system-ui, sans-serif;
  --fs-label: 11px; --fs-small: 12px; --fs-body: 13px; --fs-pill: 17px;

  /* Spring (dipakai library animasi: nilai untuk motion/framer-style) */
  --spring-ui:    280 24 1;   /* stiffness damping mass: interaksi umum */
  --spring-soft:  180 22 1;   /* menu & blob aktif */
  --spring-snap:  420 30 1;   /* tekan/lepas */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1); /* fallback CSS-only */
}
```

Tema terang: tint dinaikkan ke opasitas 0.65 dengan lightness tinggi; `--text: #14181F`; hapus `--text-shadow`.

## 4. Efek Kaca ("Liquid Glass")

Susunan lapisan tiap segmen (bawah → atas):

1. **Blur latar**: DWM acrylic (Win11) / wallpaper-blur (Win10), `blur(var(--glass-blur)) saturate(var(--glass-saturate))`.
2. **Tint** segmen (`--tint-*`).
3. **Gradien tepi**: `linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%)`.
4. **Noise** 3% (SVG feTurbulence statis, mencegah banding).
5. **Border** 1 px `--glass-border` + `--glass-inner-shadow`.
6. **Konten**.

Tambahan "kilau bergerak": gradien putih diagonal (opasitas 12%) yang bergeser 0–40% mengikuti posisi kursor secara horizontal (spring-soft). Hanya aktif saat kursor di dekat dock.

Fallback tanpa blur / High Contrast / hemat daya: warna solid `rgba(40,45,70,0.92)`, tanpa kilau.

## 5. Ikonografi

| Kategori | Set | Gaya |
|---|---|---|
| Ikon UI (Wi-Fi, volume, baterai, cari, power, chevron, ✕) | Phosphor atau Fluent System Icons | fill/regular, 16–18 px |
| Ikon bawaan (File Explorer, Musik, Catatan, Kalender, Pengaturan) | Fluent Color atau Fluent Emoji 3D | berwarna, di ubin squircle |
| Ikon aplikasi pihak ketiga | ikon asli | dinormalisasi (lihat bawah) |

**Normalisasi ikon pihak ketiga**: crop ke bounding box konten → skala ke 80% area ubin → mask squircle `--r-icon` → latar `--chip` jika transparan → bayangan `0 4px 10px rgba(0,0,0,0.25)` → highlight atas 1 px.

**Kalender dinamis**: header merah `#FF5A52` (14 px) berisi singkatan bulan putih 8 px bold, tanggal 20 px bold gelap. Diperbarui tengah malam.

Ikon dirender SVG/bitmap @2x, di-cache di `%APPDATA%\FloatDock\icons`. Icon pack per tema dapat menimpa ikon via peta `exe-name → file`.

## 6. Komponen Detail

### 6.1 Start tile
52×52, `--r-tile`, tint `--tint-start`, ikon 4 kotak putih 18 px. Hover: scale 1.06, glow `--glow` 0 0 18 px. Tekan: spring-snap ke 0.94. Saat menu terbuka, ikon berputar halus 90° (opsional).

### 6.2 Pill timer
72×44, `--chip`, angka `--fs-pill` bold, sublabel `--fs-small` ("minum"). Tema Grimoire: cincin mana tipis (stroke 2 px `--accent`) mengelilingi pill yang terisi sesuai sisa waktu. Selesai: cincin berdenyut 2× dan Notch melebar.

### 6.3 Ikon aplikasi
48×48, jarak 6. **Magnification kontinu**: skala = `1 + 0.35 * exp(-(d²)/(2σ²))`, d = jarak kursor ke pusat ikon (px), σ = 56. Sumbu Y naik `scale*6` px. Spring-ui. Tooltip muncul setelah 350 ms (jendela terpisah, bukan di dalam jendela dock). Drag reorder memakai FLIP; ikon yang diseret terangkat (scale 1.1, bayangan).

### 6.4 Segmen sistem
Chevron, Wi-Fi, volume, baterai (16 px, jarak 10), separator 1×28, lalu jam "14:14" (bold 13) dan tanggal "24/10/2026" (12, `--text-2`). Scroll di volume mengubah level; flyout slider kaca.

### 6.5 Kartu notifikasi (segmen Notif)
Tinggi 52, avatar 28, judul 12 semibold, isi 11 `--text-2`, tombol ✕ chip 28×28. Muncul dari sisi kanan segmen A (translateX + opacity, spring-soft), otomatis hilang 6 detik, tahan saat hover.

### 6.6 Start Menu (v0.2)
Ukuran 392×**420** (v0.1 terpotong; footer wajib terlihat), `--r-menu`, `--tint-apps` lebih pekat, blur 32. Isi: pencarian 40 px; tab kategori (Semua, Dipin, Terbaru) sebagai pill 28 px; grid 4×3 dengan scroll halus + indikator; footer avatar "Awal" + tombol power.
- Buka: opacity + translateY 10→0 + scale .97→1, spring-soft; ikon grid muncul bertahap (stagger 18 ms).
- Mode "Grimoire": menu tampil seperti halaman buku; ganti tab = animasi balik halaman 3D ringan (`rotateY` pada bidang, 220 ms), bukan sprite.
- Pencarian: hasil instan <50 ms, sorotan teks cocok `--accent`.
- Tinggi jendela harus dihitung dari konten + padding (bukan konstanta) agar footer tidak terpotong.

### 6.7 Notch
Idle 116×36 hitam; "mata" dua titik. Ekspresi (tema Grimoire): netral (titik), senang (lengkung ke atas) untuk notifikasi, mengantuk (setengah tertutup) saat idle lama, fokus (garis) saat timer jalan. Ekspansi memakai spring-ui; konten fade setelah lebar tercapai.

## 7. Latar Parallax Berlapis ("3D")

Jendela terpisah `backdrop` (transparan, click-through `WS_EX_TRANSPARENT`, di bawah dock, di atas desktop), luasnya mencakup dock + 80 px ke segala arah.

| Layer | Isi | Gerak | Opasitas |
|---|---|---|---|
| L0 Jauh | Gradien mana + kabut (canvas/CSS) | ±2 px, lambat (drift 30 dtk) | 0.5 |
| L1 Tengah | **Siluet** (PNG alpha) di-mask ke bentuk segmen, terlihat samar menembus kaca | ±6 px mengikuti kursor (spring-soft) | 0.18–0.30 |
| L2 Dekat | Partikel mana, kilau tepi | ±10 px, partikel naik pelan | 0.6 |

Aturan:
- Siluet di belakang kaca: `mix-blend-mode: soft-light`, `filter: blur(1.5px)`; terlihat di celah antarsegmen sebagai bayangan, bukan di atas ikon.
- Parallax dihitung dari posisi kursor global (`GetCursorPos`, 30 Hz), dihaluskan spring.
- Dijeda: dock tersembunyi, aplikasi fullscreen, baterai < 20% & hemat daya, `prefers-reduced-motion`.
- Anggaran: ≤ 3% GPU, < 1% CPU idle; partikel maks 40, hitung di GPU (canvas 2D/WebGL ringan).

## 8. Sistem Tema

Struktur folder:

```
%APPDATA%\FloatDock\themes\<nama-tema>\
├─ theme.json
├─ wallpaper.jpg        (opsional)
├─ silhouette.png       (opsional, PNG alpha)
├─ icons\               (opsional: <exe-name>.svg|png)
├─ sounds\              (opsional: hover.wav, open.wav, notify.wav)
└─ particles.json       (opsional)
```

Aturan:
- Tema pengguna dimuat dari folder, divalidasi skema, dan tidak boleh menjalankan skrip.
- Aset pihak ketiga yang berhak cipta (termasuk karakter anime) **tidak dibundel** di installer atau preset resmi; pengguna menambahkannya sendiri untuk pemakaian pribadi.
- Preset bawaan hanya memakai aset orisinal.

### 8.1 Preset bawaan

| Preset | Karakter |
|---|---|
| **Grimoire Verdant** | Tint hijau-ungu, mana hijau, siluet penyihir berjubah (orisinal), menu gaya halaman buku |
| **Grimoire Ember** | Tint merah-oranye, partikel bara |
| **Grimoire Tide** | Tint biru-cyan, riak air |
| **Grimoire Umbra** | Hitam-ungu, kabut gelap |
| **Clean Glass** | Tanpa siluet/partikel, tint netral (performa maksimal) |

### 8.2 Atribut mana (palet aksen)

| Atribut | Aksen | Efek hover |
|---|---|---|
| Api | `#FF6B3D` | percikan naik |
| Air | `#3DB8FF` | riak |
| Angin | `#8CFFD9` | pusaran halus |
| Bumi | `#C9A56B` | debu kristal |
| Gelap | `#9B7CFF` | kabut |
| Cahaya | `#FFE066` | kilau bintang |

### 8.3 Siluet orisinal (arahan aset)
Penyihir berjubah dari belakang, grimoire melayang, lingkaran sihir di kaki, aura mana. Ekspor PNG 1600×600, alpha, kontras tinggi, tepi lembut. Pose berbeda per preset bila diinginkan.

## 9. Gerak

| Elemen | Mekanisme |
|---|---|
| Hover ikon / magnification | spring-ui |
| Blob aktif berpindah | spring-soft |
| Tekan | spring-snap |
| Menu buka/tutup | spring-soft (tutup 120 ms ease-out) |
| Notch | spring-ui |
| Segmen muncul/hilang (auto-hide) | translateY 80→0, spring-soft |
| Parallax | spring-soft, 30 Hz input |

Hanya `transform` dan `opacity` dianimasikan. `prefers-reduced-motion`: matikan magnification, parallax, partikel, balik halaman; ganti dengan fade 120 ms.

## 10. Implikasi Teknis (perubahan dari v0.1)

| Area | Perubahan |
|---|---|
| Jendela | Dari 1 jendela dock → **1 jendela lebar transparan** yang memuat semua segmen (celah transparan + click-through per-region) **atau** satu jendela per segmen. Rekomendasi M0: satu jendela lebar, hit-test region lewat `WM_NCHITTEST`/`SetWindowRgn` gabungan atau `WS_EX_LAYERED` + alpha hit-test |
| Blur | Acrylic satu persegi tidak cocok untuk segmen terpisah → pakai **wallpaper-blur per segmen** (Win10 & Win11) agar tiap pil punya bentuk sendiri; acrylic DWM hanya untuk mode "Native Blur" opsional |
| Backdrop | Jendela tambahan `backdrop` untuk parallax, click-through, `HWND_BOTTOM` di atas desktop |
| Tooltip/flyout | Jendela terpisah agar tidak memperbesar jendela dock |
| Tema | Loader tema + validasi skema (JSON Schema), hot-reload saat file berubah |
| Ikon | Pipeline normalisasi (crop, mask, bayangan) di Rust, cache di disk |
| Audio | Efek suara opsional (WASAPI via `rodio`), default mati |
| Pengaturan | Pemilih tema, atribut mana, intensitas parallax/partikel, mode performa |

## 11. Aksesibilitas & Performa

- Kontras teks AA; `--text-shadow` aktif otomatis jika luminans latar > 0.6.
- Fokus keyboard: cincin 2 px `--accent`, offset 2. Dock `role="toolbar"`, grid `role="grid"`.
- Target klik ≥ 32×32.
- Mode performa: Penuh / Seimbang (tanpa partikel) / Hemat (tanpa parallax & kilau, tint solid).
- Anggaran: RAM < 90 MB (dengan tema penuh), CPU idle < 1%, 60 fps interaksi.

## 12. Daftar Aset

- Set ikon Phosphor/Fluent (SVG), ikon bawaan Fluent Color/3D, font Inter variable.
- 5 preset tema + siluet orisinal tiap preset, tekstur noise, partikel.
- Efek suara opsional (lisensi bebas/orisinal).

## 13. Kriteria Penerimaan Visual

1. Tiap segmen punya bentuk membulat bersih, tanpa area persegi buram di luar bentuk.
2. Celah antarsegmen benar-benar transparan dan klik tembus.
3. Footer Start Menu selalu terlihat penuh.
4. Magnification tanpa patah-patah pada 60 fps.
5. Siluet terlihat samar di celah/kaca, tidak menutupi ikon atau mengurangi keterbacaan.
6. Ganti tema tanpa restart.

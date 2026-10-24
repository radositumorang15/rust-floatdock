# PRD — Float Dock (nama kerja)

Dock + Start Menu + Notch untuk Windows 10 & 11, gaya glassmorphism.
Versi: 0.1 · Tanggal: 24 Okt 2026 · Status: Draft

---

## 1. Ringkasan

Float Dock adalah aplikasi kustomisasi desktop yang menggantikan taskbar Windows dengan tiga komponen:

1. **Dock** melayang di bawah layar (pinned app, app berjalan, widget, system tray, jam).
2. **Start Menu** popup ringkas (pencarian + grid aplikasi + profil + power).
3. **Notch** di tengah atas layar (pulau status: timer, media, notifikasi).

Semua memakai efek kaca buram (acrylic/mica), sudut membulat, dan animasi halus.

## 2. Tujuan & Non-Tujuan

**Tujuan**
- Tampilan sesuai referensi, konsisten di Windows 10 (1809+) dan Windows 11.
- Ringan: RAM idle < 80 MB, CPU idle < 1%.
- Berfungsi seperti taskbar sungguhan: jendela maximize berhenti di atas dock.
- Aman: taskbar asli selalu kembali jika aplikasi crash/ditutup.

**Non-Tujuan (v1)**
- Menggantikan Start Menu bawaan Windows secara penuh (hook tombol Win opsional).
- Menampilkan ikon tray pihak ketiga (API Windows tidak mengizinkan secara resmi).
- Dukungan multi-monitor penuh (v1.1).
- macOS/Linux.

## 3. Target Pengguna

Pengguna Windows yang suka kustomisasi desktop dan ingin tampilan modern bergaya macOS/iPadOS tanpa mengorbankan fungsi dasar taskbar.

## 4. Platform & Teknologi

| Aspek | Keputusan |
|---|---|
| OS | Windows 10 1809+ dan Windows 11 |
| Backend | Rust + crate `windows` (Win32/WinRT) |
| UI | Tauri v2 (WebView2) dengan HTML/CSS/TypeScript (Svelte atau React) |
| Blur | `window-vibrancy` (acrylic) + DWM API |
| Info sistem | `sysinfo`, WLAN/NLM API, `IAudioEndpointVolume`, `GetSystemPowerStatus` |
| Cuaca | Open-Meteo (tanpa API key) |
| Penyimpanan | JSON/TOML di `%APPDATA%\FloatDock` |
| Distribusi | Installer MSI/NSIS, autostart via Task Scheduler/registry |

**Catatan teknis penting**: `backdrop-filter: blur` di CSS hanya mengaburkan konten di dalam webview, bukan desktop di belakangnya. Blur desktop harus dari DWM/acrylic. Konsekuensinya:
- **Win11**: acrylic/mica + `DWMWA_WINDOW_CORNER_PREFERENCE` = sudut membulat native.
- **Win10**: acrylic mengisi seluruh persegi jendela, jadi sudut membulat dicapai dengan `SetWindowRgn` (tepi agak bergerigi) atau teknik "wallpaper blur": wallpaper diambil, diburamkan, lalu dirender sebagai latar dock dengan offset sesuai posisi. Rekomendasi: wallpaper blur sebagai default Win10, karena hasilnya halus dan sudut bebas.

## 5. Komponen & Kebutuhan Fungsional

### 5.1 Dock

| ID | Kebutuhan | Prioritas |
|---|---|---|
| D-01 | Dock melayang, terpusat horizontal, jarak ke tepi bawah ±16 px | P0 |
| D-02 | Daftar pinned app (drag-drop file .exe/.lnk/UWP untuk menambah, drag untuk urutkan, klik kanan > Lepas) | P0 |
| D-03 | Ikon asli aplikasi (dari .exe/.lnk/UWP), di-cache | P0 |
| D-04 | Tampilkan app berjalan: indikator titik di bawah ikon; klik = fokus/minimize/restore | P0 |
| D-05 | Klik pinned app yang belum jalan = luncurkan; klik tengah = instance baru | P0 |
| D-06 | Registrasi AppBar (`SHAppBarMessage`) agar work area berkurang; jendela maximize berhenti di atas dock | P0 |
| D-07 | Sembunyikan taskbar bawaan saat aktif, pulihkan saat keluar/crash (watchdog proses terpisah) | P0 |
| D-08 | Efek hover: ikon membesar (magnification) + tooltip nama | P1 |
| D-09 | Pratinjau jendela saat hover (DWM thumbnail) | P2 |
| D-10 | Badge/bounce saat app meminta perhatian (flash window) | P2 |
| D-11 | Auto-hide dock (opsional) dengan trigger di tepi bawah | P1 |
| D-12 | Ikon kalender dinamis (bulan + tanggal hari ini) | P1 |
| D-13 | Pemisah (separator) antara grup: Start/widget, app, tray | P0 |
| D-14 | Context menu ikon: Buka, Jalankan sebagai admin, Tutup jendela, Lepas dari dock | P1 |

### 5.2 Widget di Dock

| ID | Kebutuhan | Prioritas |
|---|---|---|
| W-01 | Tombol Start (ikon 4 kotak) membuka/menutup Start Menu | P0 |
| W-02 | Pill timer/pengingat (contoh "57:12 minum"): hitung mundur, klik = pause/reset, klik kanan = atur label & durasi, notifikasi saat habis | P1 |
| W-03 | Cuaca: ikon + suhu (30°), refresh 30 menit, lokasi otomatis/manual | P1 |
| W-04 | Jam & tanggal (HH:mm, dd/MM/yyyy sesuai locale), klik membuka panel kalender mini | P0 |

### 5.3 System Tray (versi sendiri)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| T-01 | Chevron "tampilkan lainnya" membuka flyout | P1 |
| T-02 | Wi-Fi: status & nama jaringan; klik membuka flyout Wi-Fi bawaan Windows (`ms-availablenetworks:`) | P0 |
| T-03 | Volume: ikon sesuai level/mute; scroll mengubah volume; klik membuka slider | P0 |
| T-04 | Baterai: persen, status mengisi daya | P0 |
| T-05 | Ikon tray pihak ketiga: tidak didukung v1; chevron menampilkan tautan ke area tray Windows (open `shell:::{05d7b0f4-2121-4eff-bf6b-ed3f69b894d9}`) | P2 |

### 5.4 Start Menu

| ID | Kebutuhan | Prioritas |
|---|---|---|
| S-01 | Popup di atas tombol Start, animasi muncul (fade + naik 8 px, 180 ms) | P0 |
| S-02 | Kolom pencarian "Cari aplikasi…" (fuzzy, hasil instan, fokus otomatis saat dibuka) | P0 |
| S-03 | Grid 4 kolom aplikasi (ikon 48 px + label), sumber: app yang dipin ke Start + semua app terpasang | P0 |
| S-04 | Indeks aplikasi: Start Menu folder, UWP (`shell:AppsFolder`), refresh saat ada perubahan | P0 |
| S-05 | Footer: avatar + nama pengguna (klik = akun), tombol power (Sleep, Restart, Shutdown, Lock, Sign out) | P0 |
| S-06 | Tutup saat klik di luar, tekan Esc, atau app diluncurkan | P0 |
| S-07 | Pencarian file/pengaturan (via Windows Search index) | P2 |
| S-08 | Hook tombol Win membuka Start Menu ini | P2 |

### 5.5 Notch

| ID | Kebutuhan | Prioritas |
|---|---|---|
| N-01 | Notch hitam menempel tepi atas, tengah layar, sudut bawah membulat | P0 |
| N-02 | Idle: dua titik putih ("mata") dengan animasi kedip pelan | P1 |
| N-03 | Hover/klik: melebar menampilkan jam & tanggal | P1 |
| N-04 | Event timer selesai: melebar menampilkan label & hitung mundur | P1 |
| N-05 | Media: judul lagu + kontrol (via GSMTC / `GlobalSystemMediaTransportControlsSession`) | P2 |
| N-06 | Notifikasi sistem ringkas (butuh UserNotificationListener, app harus punya package identity) | P3 |
| N-07 | Click-through di luar area notch | P0 |

### 5.6 Pengaturan

Jendela Pengaturan: ukuran ikon, magnification, posisi dock (bawah; atas/samping v1.1), auto-hide, tema (terang/gelap/otomatis), intensitas blur & opasitas, warna aksen, widget aktif/nonaktif, lokasi cuaca, autostart, bahasa (ID/EN), reset ke default.

## 6. Kebutuhan Non-Fungsional

| Kategori | Target |
|---|---|
| RAM idle (semua jendela) | < 80 MB (Tauri), target stretch < 50 MB |
| CPU idle | < 1% |
| Startup sampai dock tampil | < 1,5 detik |
| Frame rate animasi | 60 fps pada GPU terintegrasi |
| Keamanan | Tidak memerlukan admin; tidak mengirim data selain cuaca |
| Ketahanan | Taskbar asli dipulihkan pada exit normal, crash, logoff; watchdog |
| DPI | Mendukung 100–250% dan per-monitor DPI v2 |
| Aksesibilitas | Navigasi keyboard, kontras teks AA, dukungan High Contrast (nonaktifkan blur) |

## 7. Arsitektur Singkat

```
float-dock (satu proses Rust)
├─ core/        appbar, taskbar hide/restore, window tracker (EnumWindows + WinEvent hook)
├─ services/    icons, apps-index, launcher, volume, network, battery, weather, timer, media
├─ windows/     dock, start_menu, notch, settings   (4 jendela Tauri)
├─ ipc/         command + event ke frontend
└─ watchdog     proses kecil terpisah: pulihkan Shell_TrayWnd jika proses utama mati

frontend (TypeScript)
├─ components/  Dock, DockItem, Pill, TrayIcon, StartMenu, AppGrid, Notch
└─ styles/      tokens.css (lihat DESIGN.md)
```

Window tracker memakai `SetWinEventHook` (create/destroy/foreground/namechange), bukan polling. Filter jendela: visible, bukan `WS_EX_TOOLWINDOW`, tidak cloaked (`DWMWA_CLOAKED`), tanpa owner.

## 8. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Taskbar tersembunyi tidak kembali setelah crash | Tinggi | Watchdog + restore saat startup + tombol darurat (Ctrl+Alt+Shift+T) |
| Win11 menampilkan ulang taskbar saat update shell/Explorer restart | Sedang | Dengarkan pesan `TaskbarCreated`, sembunyikan ulang |
| Ikon tray pihak ketiga tidak bisa diambil | Sedang | Dinyatakan non-tujuan v1; sediakan jalan pintas ke tray bawaan |
| Blur sudut membulat di Win10 | Sedang | Wallpaper-blur atau `SetWindowRgn` |
| API tidak terdokumentasi (`SetWindowCompositionAttribute`) berubah | Rendah | Fallback ke warna solid semi-transparan |
| WebView2 tidak terpasang (Win10 lama) | Rendah | Bootstrapper di installer |
| Antivirus menandai penyembunyian taskbar/hook | Sedang | Tanda tangan kode, tidak ada injeksi DLL |
| Game fullscreen tertutup dock | Sedang | Deteksi fullscreen (`SHQueryUserNotificationState`) lalu sembunyikan dock |

## 9. Roadmap

| Fase | Isi | Estimasi |
|---|---|---|
| M0 — Prototipe | Jendela dock tanpa border + blur, ikon statis, AppBar | 1–2 minggu |
| M1 — Dock inti | Pinned, app berjalan, ikon asli, hide/restore taskbar, watchdog | 3 minggu |
| M2 — Start Menu | Indeks app, pencarian, grid, footer, power | 2 minggu |
| M3 — Tray & widget | Wi-Fi, volume, baterai, jam, cuaca, timer pill | 2 minggu |
| M4 — Notch | Idle, jam, timer, animasi | 1–2 minggu |
| M5 — Polish | Magnification, auto-hide, pengaturan, tema, DPI, installer | 2–3 minggu |
| Beta | Uji Win10/11, multi-DPI, perbaikan bug | 2 minggu |

## 10. Metrik Keberhasilan

- 0 insiden taskbar tidak kembali pada 100 sesi uji crash.
- RAM idle < 80 MB pada Windows 10 dan 11.
- ≥ 95% jendela aplikasi umum terdeteksi benar (uji 30 aplikasi populer).
- Waktu dari klik Start sampai menu tampil < 120 ms.

## 11. Pertanyaan Terbuka

1. Nama produk & lisensi (open source atau komersial)?
2. Apakah tombol Win harus membuka Start Menu baru ini di v1?
3. Perlu ikon tray pihak ketiga? Jika ya, perlu riset hook `Shell_TrayWnd` (rapuh antar versi Windows).
4. Posisi dock selain bawah (atas/kiri/kanan) masuk v1 atau v1.1?
5. Framework UI final: Tauri (cepat) atau native (Slint/GPUI, lebih ringan tapi blur lebih rumit)?

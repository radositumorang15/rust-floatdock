# Panduan Ekosistem Tema FloatDock

FloatDock mendukung sistem tema modular terinspirasi dari **Seelen UI**, **Rainmeter**, dan **Wallpaper Engine**. Pengguna bebas memasang preset tema pribadi di `%APPDATA%\FloatDock\themes\`.

## 1. Struktur Theme Pack
Setiap tema berada dalam folder terpisah:
```
themes/
├── grimoire/
│   ├── theme.json
│   ├── README.md
│   ├── wall.jpg (opsional)
│   ├── icons/   (opsional)
│   └── sounds/  (opsional)
└── liquid-glass/
    └── theme.json
```

## 2. Format `theme.json`
```json
{
  "name": "Grimoire",
  "accent": "#7CFFB2",
  "glow": { "color": "#7CFFB2", "flow": true },
  "wallpaper": "wall.jpg",
  "startMenu": { "style": "pages" },
  "notch": { "eyes": "custom" },
  "particles": { "onHover": "mana" }
}
```

## 3. Legalitas & Aset Pengguna
Build bawaan aplikasi FloatDock tidak mendistribusikan karya berhak cipta (karakter resmi anime, trademark, atau musik berlisensi). Semua efek bertema anime diwujudkan melalui:
- Nama orisinal: Preset sihir "Grimoire".
- Simbol geometris orisinal (seperti `GeometricClover`).
- Palet Atribut Elemen Mana (Wind, Fire, Water, Earth, Light, Dark).
- Fleksibilitas bagi pengguna untuk menyematkan wallpaper dan ikon anime mereka sendiri secara lokal di komputer pribadi masing-masing.

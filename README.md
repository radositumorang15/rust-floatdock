# 🌊 Float Dock for Windows

<p align="center">
  <img src="./public/vite.svg" width="80" height="80" alt="Float Dock Logo" />
</p>

<p align="center">
  <b>A modern, high-performance floating dock and dynamic status notch for Windows 10 & 11.</b><br>
  Built with <b>Rust (Tauri v2)</b>, <b>React 19</b>, <b>TypeScript</b>, and <b>Vite</b>.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D6?logo=windows&logoColor=white" alt="Platform Windows" />
  <img src="https://img.shields.io/badge/Backend-Rust%202024%20%7C%20Tauri%20v2-orange?logo=rust&logoColor=white" alt="Rust Tauri" />
  <img src="https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Styling-Liquid%20Glass%20CSS-blueviolet" alt="Liquid Glass" />
</p>

---

## ✨ Features

### 1. 🪟 Segmented Floating Glass Dock
- **Triple-Segment Layout**:
  - **Start Island**: Direct access to custom glass Start Menu and theme customization.
  - **Main Apps Island**: Running application indicators, taskbar apps, tool quick actions, and customizable timer capsule.
  - **System Tray Island**: Real-time battery indicator, volume step control, Wi-Fi status, and live clock.
- **True Desktop Transparency**: Utilizes Windows Desktop Window Manager (`DwmExtendFrameIntoClientArea`) to deliver transparent borders without opaque backgrounds.
- **AppBar Work-Area Integration**: Registers as a native Windows AppBar (`SHAppBarMessage`) to prevent maximized windows from bleeding behind the dock.

### 2. 🎬 Animated Video Backdrop Layer
- Seamlessly plays looping animated video backdrops (e.g. *Asta Demon Black Clover*) directly behind the dock's glass layer.
- Customizable opacity (25%, 45%, 65%) and CSS blend modes (`screen`, `overlay`, `normal`).
- Works consistently across all themes and in standalone `.exe` release mode.

### 3. 🏝️ Dynamic Island / Notch
- Floating status capsule at the top center of your primary screen.
- Media player integration, battery level, live timer countdown, and interactive hover expansion physics.

### 4. 🔮 Mana & Theme Engine
- Includes pre-tailored themes:
  - **Grimoire Verdant**: Black Clover-inspired theme with interactive mana particle physics (Wind, Fire, Water, Earth, Light, Dark).
  - **Light Pastel Glass**: Crisp light mode with subtle color tints.
  - **Liquid Glass**: Apple-inspired pure crystal aesthetic.
  - **Crystal Clear**: Ultra-minimalist high-transparency glass.
  - **Obsidian Dark**: Sleek deep dark mode.
- Synchronized cross-window theme broadcasting via Tauri IPC and `BroadcastChannel`.

### 5. 🛡️ Safety & Watchdog Architecture
- **Watchdog Process (`watchdog.exe`)**: Automatically restores the native Windows Taskbar (`Shell_TrayWnd`) if the main dock ever exits or encounters an unexpected termination.
- **Single-Instance Mutex (`CreateMutexW`)**: Guarantees only one instance runs at a time, preventing WebView2 profile directory lock conflicts (`0x800700AA`).

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core & Windowing** | [Tauri v2](https://v2.tauri.app/) (Rust 2024 edition) |
| **Windows OS APIs** | [`windows-rs`](https://github.com/microsoft/windows-rs) (Win32 DWM, Shell, User32, Multimedia, Power) |
| **Frontend Framework** | [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Build Tooling** | [Vite](https://vite.dev/) |
| **Icons & Aesthetics** | Custom squircle SVG icons with 1px specular highlight + [Lucide Icons](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- Windows 10 or 11 (64-bit)
- [Node.js](https://nodejs.org/) (v18 or newer)
- [Rust & Cargo](https://rustup.rs/) (stable toolchain)
- Microsoft Edge WebView2 Runtime (pre-installed on Windows 10/11)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/radositumorang15/rust-floatdock.git
   cd rust-floatdock
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run tauri dev
   ```

---

## 📦 Building for Production

To compile an optimized, standalone Windows `.exe` without installer overhead:

```bash
npm run tauri build -- --no-bundle
```

The resulting binaries will be available at:
- **`src-tauri/target/release/float-dock.exe`** (~16 MB with embedded frontend & video assets)
- **`src-tauri/target/release/watchdog.exe`** (Watchdog taskbar restore daemon)

You can launch `float-dock.exe` directly by double-clicking it without needing terminal or Node.js.

---

## ⚙️ Configuration & Shortcuts

- **Start Menu**: Left-click the Windows logo icon on the far left.
- **Theme & Video Controls**: Right-click the Windows logo icon to access:
  - Theme switching & Mana attributes
  - Video backdrop toggling (`[ON] / [OFF]`)
  - Video Blend Mode (`SCREEN` / `OVERLAY` / `NORMAL`)
  - Video Opacity (`25%` / `45%` / `65%`)
- **Settings Modal**: Right-click the **Pengaturan (Settings)** icon on the dock.

---

## 📄 License

This project is open-source under the [MIT License](LICENSE).

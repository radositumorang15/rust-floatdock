//! Start Menu and Installed Applications Indexer
//! Scans Windows shortcuts and provides default matching pinned applications.

use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppEntry {
    pub id: String,
    pub name: String,
    pub exec_path: String,
    pub icon_name: String,
    pub is_pinned: bool,
    pub category: String,
}

pub fn get_default_dock_apps() -> Vec<AppEntry> {
    vec![
        AppEntry {
            id: "explorer".to_string(),
            name: "File Explorer".to_string(),
            exec_path: "explorer.exe".to_string(),
            icon_name: "explorer".to_string(),
            is_pinned: true,
            category: "System".to_string(),
        },
        AppEntry {
            id: "store".to_string(),
            name: "Microsoft Store".to_string(),
            exec_path: "ms-windows-store:".to_string(),
            icon_name: "store".to_string(),
            is_pinned: true,
            category: "System".to_string(),
        },
        AppEntry {
            id: "pureref".to_string(),
            name: "PureRef".to_string(),
            exec_path: "PureRef.exe".to_string(),
            icon_name: "pureref".to_string(),
            is_pinned: true,
            category: "Design".to_string(),
        },
        AppEntry {
            id: "creativecloud".to_string(),
            name: "Creative Cloud".to_string(),
            exec_path: r"C:\Program Files\Adobe\Adobe Creative Cloud\ACC\Creative Cloud.exe".to_string(),
            icon_name: "creativecloud".to_string(),
            is_pinned: true,
            category: "Design".to_string(),
        },
        AppEntry {
            id: "illustrator".to_string(),
            name: "Adobe Illustrator".to_string(),
            exec_path: r"C:\Program Files\Adobe\Adobe Illustrator 2026\Support Files\Contents\Windows\Illustrator.exe".to_string(),
            icon_name: "illustrator".to_string(),
            is_pinned: true,
            category: "Design".to_string(),
        },
        AppEntry {
            id: "cursor".to_string(),
            name: "Cursor".to_string(),
            exec_path: r"C:\Users\tamu\AppData\Local\Programs\cursor\Cursor.exe".to_string(),
            icon_name: "cursor".to_string(),
            is_pinned: true,
            category: "Development".to_string(),
        },
        AppEntry {
            id: "github".to_string(),
            name: "GitHub Desktop".to_string(),
            exec_path: r"C:\Users\tamu\AppData\Local\GitHubDesktop\GitHubDesktop.exe".to_string(),
            icon_name: "github".to_string(),
            is_pinned: true,
            category: "Development".to_string(),
        },
        AppEntry {
            id: "telegram".to_string(),
            name: "Telegram".to_string(),
            exec_path: "telegram.exe".to_string(),
            icon_name: "telegram".to_string(),
            is_pinned: true,
            category: "Communication".to_string(),
        },
        AppEntry {
            id: "antigravity".to_string(),
            name: "Antigravity IDE".to_string(),
            exec_path: r"D:\Antigravity IDE\Antigravity IDE.exe".to_string(),
            icon_name: "antigravity".to_string(),
            is_pinned: true,
            category: "Development".to_string(),
        },
        AppEntry {
            id: "terminal".to_string(),
            name: "Terminal".to_string(),
            exec_path: "wt.exe".to_string(),
            icon_name: "terminal".to_string(),
            is_pinned: true,
            category: "System".to_string(),
        },
        AppEntry {
            id: "chrome".to_string(),
            name: "Google Chrome".to_string(),
            exec_path: r"C:\Program Files\Google\Chrome\Application\chrome.exe".to_string(),
            icon_name: "chrome".to_string(),
            is_pinned: true,
            category: "Browser".to_string(),
        },
        AppEntry {
            id: "settings".to_string(),
            name: "Pengaturan".to_string(),
            exec_path: "ms-settings:".to_string(),
            icon_name: "settings".to_string(),
            is_pinned: true,
            category: "System".to_string(),
        },
    ]
}

/// Scans a directory recursively for .lnk files
fn scan_shortcuts(dir: &Path, list: &mut Vec<AppEntry>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                scan_shortcuts(&path, list);
            } else if let Some(ext) = path.extension() {
                if ext.to_string_lossy().eq_ignore_ascii_case("lnk") {
                    let file_stem = path
                        .file_stem()
                        .map(|s| s.to_string_lossy().to_string())
                        .unwrap_or_default();
                    if !file_stem.is_empty() {
                        list.push(AppEntry {
                            id: format!("lnk_{}", file_stem),
                            name: file_stem.clone(),
                            exec_path: path.to_string_lossy().to_string(),
                            icon_name: "default".to_string(),
                            is_pinned: false,
                            category: "Applications".to_string(),
                        });
                    }
                }
            }
        }
    }
}

pub fn get_all_indexed_apps() -> Vec<AppEntry> {
    let mut apps = get_default_dock_apps();

    // Check Start Menu paths on Windows
    #[cfg(windows)]
    {
        if let Ok(appdata) = env::var("APPDATA") {
            let user_start = PathBuf::from(appdata)
                .join("Microsoft")
                .join("Windows")
                .join("Start Menu")
                .join("Programs");
            scan_shortcuts(&user_start, &mut apps);
        }

        if let Ok(programdata) = env::var("ProgramData") {
            let sys_start = PathBuf::from(programdata)
                .join("Microsoft")
                .join("Windows")
                .join("Start Menu")
                .join("Programs");
            scan_shortcuts(&sys_start, &mut apps);
        }
    }

    apps
}

pub fn search_apps(query: &str) -> Vec<AppEntry> {
    let all = get_all_indexed_apps();
    if query.trim().is_empty() {
        return all;
    }
    let q = query.trim().to_lowercase();
    all.into_iter()
        .filter(|app| {
            app.name.to_lowercase().contains(&q) || app.category.to_lowercase().contains(&q)
        })
        .collect()
}

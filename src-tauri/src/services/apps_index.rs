//! Start Menu and Installed Applications Indexer
//! Scans Windows taskbar pinned shortcuts and Start Menu programs.

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
    pub icon_url: Option<String>,
    pub is_pinned: bool,
    pub category: String,
}

pub fn resolve_icon_name(name: &str) -> String {
    let lower = name.to_lowercase();
    if lower.contains("explorer") {
        "explorer".to_string()
    } else if lower.contains("chrome") {
        "chrome".to_string()
    } else if lower.contains("antigravity") {
        "antigravity".to_string()
    } else if lower.contains("visual studio code") || lower.contains("vscode") || lower == "code" {
        "vscode".to_string()
    } else if lower.contains("figma") {
        "figma".to_string()
    } else if lower.contains("comet") {
        "comet".to_string()
    } else if lower.contains("pureref") {
        "pureref".to_string()
    } else if lower.contains("illustrator") {
        "illustrator".to_string()
    } else if lower.contains("creative cloud") {
        "creativecloud".to_string()
    } else if lower.contains("cursor") {
        "cursor".to_string()
    } else if lower.contains("github") {
        "github".to_string()
    } else if lower.contains("telegram") {
        "telegram".to_string()
    } else if lower.contains("terminal") || lower.contains("cmd") || lower.contains("powershell") {
        "terminal".to_string()
    } else if lower.contains("store") {
        "store".to_string()
    } else if lower.contains("setting") || lower.contains("pengaturan") {
        "settings".to_string()
    } else if lower.contains("brave") {
        "brave".to_string()
    } else if lower.contains("edge") {
        "edge".to_string()
    } else if lower.contains("whatsapp") {
        "whatsapp".to_string()
    } else if lower.contains("discord") {
        "discord".to_string()
    } else if lower.contains("music") || lower.contains("spotify") {
        "music".to_string()
    } else if lower.contains("word") {
        "word".to_string()
    } else if lower.contains("powerpoint") {
        "powerpoint".to_string()
    } else if lower.contains("gemini") {
        "gemini".to_string()
    } else if lower.contains("chatgpt") {
        "chatgpt".to_string()
    } else if lower.contains("snipping") || lower.contains("snip") {
        "snipping_tool".to_string()
    } else if lower.contains("calc") || lower.contains("kalkulator") {
        "calc".to_string()
    } else if lower.contains("notepad") || lower.contains("catatan") {
        "notepad".to_string()
    } else if lower.contains("paint") {
        "paint".to_string()
    } else if lower.contains("camera") || lower.contains("kamera") {
        "camera".to_string()
    } else if lower.contains("copilot") {
        "copilot".to_string()
    } else {
        "default".to_string()
    }
}

/// Reads pinned shortcuts directly from Windows Taskbar folder
pub fn get_windows_pinned_shortcuts() -> Vec<PathBuf> {
    let mut pinned = Vec::new();
    if let Ok(appdata) = env::var("APPDATA") {
        let dir = PathBuf::from(appdata)
            .join("Microsoft\\Internet Explorer\\Quick Launch\\User Pinned\\TaskBar");
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path
                    .extension()
                    .and_then(|e| e.to_str())
                    .map(|s| s.eq_ignore_ascii_case("lnk"))
                    == Some(true)
                {
                    pinned.push(path);
                }
            }
        }
    }
    pinned
}

pub fn get_default_dock_apps() -> Vec<AppEntry> {
    let shortcuts = get_windows_pinned_shortcuts();
    if !shortcuts.is_empty() {
        let mut apps = Vec::new();
        for shortcut in shortcuts {
            if let Some(stem) = shortcut.file_stem().and_then(|s| s.to_str()) {
                if stem.to_lowercase().contains("telegram") {
                    continue;
                }
                let id = stem.to_lowercase().replace(' ', "_");
                let icon_name = resolve_icon_name(stem);
                let shortcut_str = shortcut.to_string_lossy().to_string();
                let icon_url = crate::core::icon_extractor::extract_icon_base64(&shortcut_str, 48);
                apps.push(AppEntry {
                    id,
                    name: stem.to_string(),
                    exec_path: shortcut_str,
                    icon_name,
                    icon_url,
                    is_pinned: true,
                    category: "Pinned".to_string(),
                });
            }
        }

        // Ensure core tools and apps are present
        if !apps.iter().any(|a| a.id == "antigravity" || a.icon_name == "antigravity") {
            let path = r"D:\Antigravity IDE\Antigravity IDE.exe";
            if Path::new(path).exists() {
                apps.push(AppEntry {
                    id: "antigravity".to_string(),
                    name: "Antigravity IDE".to_string(),
                    exec_path: path.to_string(),
                    icon_name: "antigravity".to_string(),
                    icon_url: crate::core::icon_extractor::extract_icon_base64(path, 48),
                    is_pinned: true,
                    category: "Development".to_string(),
                });
            }
        }

        if !apps.iter().any(|a| a.id == "terminal" || a.icon_name == "terminal") {
            apps.push(AppEntry {
                id: "terminal".to_string(),
                name: "Terminal".to_string(),
                exec_path: "wt.exe".to_string(),
                icon_name: "terminal".to_string(),
                icon_url: crate::core::icon_extractor::extract_icon_base64("wt.exe", 48),
                is_pinned: true,
                category: "System".to_string(),
            });
        }

        if !apps.iter().any(|a| a.id == "explorer" || a.icon_name == "explorer") {
            apps.push(AppEntry {
                id: "explorer".to_string(),
                name: "File Explorer".to_string(),
                exec_path: "explorer.exe".to_string(),
                icon_name: "explorer".to_string(),
                icon_url: crate::core::icon_extractor::extract_icon_base64("explorer.exe", 48),
                is_pinned: true,
                category: "System".to_string(),
            });
        }

        // Ensure Pengaturan (Settings) is always available at the end
        if !apps.iter().any(|a| a.id == "settings" || a.icon_name == "settings") {
            apps.push(AppEntry {
                id: "settings".to_string(),
                name: "Pengaturan".to_string(),
                exec_path: "ms-settings:".to_string(),
                icon_name: "settings".to_string(),
                icon_url: None,
                is_pinned: true,
                category: "System".to_string(),
            });
        }

        return apps;
    }

    // Default curated fallback apps if TaskBar folder is not accessible
    vec![
        AppEntry {
            id: "explorer".to_string(),
            name: "File Explorer".to_string(),
            exec_path: "explorer.exe".to_string(),
            icon_name: "explorer".to_string(),
            icon_url: crate::core::icon_extractor::extract_icon_base64("explorer.exe", 48),
            is_pinned: true,
            category: "System".to_string(),
        },
        AppEntry {
            id: "chrome".to_string(),
            name: "Google Chrome".to_string(),
            exec_path: "chrome.exe".to_string(),
            icon_name: "chrome".to_string(),
            icon_url: crate::core::icon_extractor::extract_icon_base64("chrome.exe", 48),
            is_pinned: true,
            category: "Browser".to_string(),
        },
        AppEntry {
            id: "antigravity".to_string(),
            name: "Antigravity IDE".to_string(),
            exec_path: r"D:\Antigravity IDE\Antigravity IDE.exe".to_string(),
            icon_name: "antigravity".to_string(),
            icon_url: crate::core::icon_extractor::extract_icon_base64(r"D:\Antigravity IDE\Antigravity IDE.exe", 48),
            is_pinned: true,
            category: "Development".to_string(),
        },
        AppEntry {
            id: "terminal".to_string(),
            name: "Terminal".to_string(),
            exec_path: "wt.exe".to_string(),
            icon_name: "terminal".to_string(),
            icon_url: crate::core::icon_extractor::extract_icon_base64("wt.exe", 48),
            is_pinned: true,
            category: "System".to_string(),
        },
        AppEntry {
            id: "settings".to_string(),
            name: "Pengaturan".to_string(),
            exec_path: "ms-settings:".to_string(),
            icon_name: "settings".to_string(),
            icon_url: None,
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
                        let icon_name = resolve_icon_name(&file_stem);
                        let path_str = path.to_string_lossy().to_string();
                        let icon_url = crate::core::icon_extractor::extract_icon_base64(&path_str, 48);
                        list.push(AppEntry {
                            id: format!("lnk_{}", file_stem),
                            name: file_stem.clone(),
                            exec_path: path_str,
                            icon_name,
                            icon_url,
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

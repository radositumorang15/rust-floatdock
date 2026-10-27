//! Native Windows Icon Extractor (Supports .exe, .lnk shortcuts, and UWP)

use std::collections::HashMap;
use std::sync::Mutex;
use once_cell::sync::Lazy;

#[cfg(windows)]
use windows::{
    core::{PCWSTR, HSTRING},
    Win32::{
        Foundation::SIZE,
        Graphics::Gdi::{
            CreateCompatibleDC, DeleteDC, DeleteObject, GetDIBits, SelectObject,
            BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS, HBITMAP,
        },
        System::Com::{CoInitializeEx, COINIT_APARTMENTTHREADED},
        UI::Shell::{IShellItemImageFactory, SHCreateItemFromParsingName, SIIGBF_ICONONLY, SIIGBF_RESIZETOFIT},
    },
};

// Cache di memori agar tidak mengekstrak ulang ikon setiap detik
static ICON_CACHE: Lazy<Mutex<HashMap<String, String>>> = Lazy::new(|| Mutex::new(HashMap::new()));

pub fn clear_icon_cache() {
    if let Ok(mut cache) = ICON_CACHE.lock() {
        cache.clear();
    }
}

#[cfg(windows)]
pub fn extract_icon_base64(path_str: &str, size: i32) -> Option<String> {
    if path_str.is_empty() {
        return None;
    }

    // Normalisasi executable umum jika tidak berupa path absolut
    let resolved_path = if path_str.eq_ignore_ascii_case("explorer.exe") || path_str.eq_ignore_ascii_case("explorer") {
        "C:\\Windows\\explorer.exe".to_string()
    } else if path_str.eq_ignore_ascii_case("cmd.exe") || path_str.eq_ignore_ascii_case("cmd") {
        "C:\\Windows\\System32\\cmd.exe".to_string()
    } else if path_str.eq_ignore_ascii_case("powershell.exe") || path_str.eq_ignore_ascii_case("powershell") {
        "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe".to_string()
    } else {
        path_str.to_string()
    };

    if let Ok(cache) = ICON_CACHE.lock() {
        if let Some(cached) = cache.get(&resolved_path) {
            return Some(cached.clone());
        }
    }

    unsafe {
        let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

        let wide_path = HSTRING::from(resolved_path.as_str());
        let factory: IShellItemImageFactory =
            SHCreateItemFromParsingName(PCWSTR(wide_path.as_ptr()), None).ok()?;

        let hbitmap: HBITMAP = factory
            .GetImage(SIZE { cx: size, cy: size }, SIIGBF_RESIZETOFIT | SIIGBF_ICONONLY)
            .ok()?;

        let hdc = CreateCompatibleDC(None);
        let old_obj = SelectObject(hdc, hbitmap.into());

        let mut bmi = BITMAPINFO {
            bmiHeader: BITMAPINFOHEADER {
                biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
                biWidth: size,
                biHeight: -size, // Top-down DIB
                biPlanes: 1,
                biBitCount: 32,
                biCompression: BI_RGB.0,
                ..Default::default()
            },
            ..Default::default()
        };

        let mut bgra_pixels = vec![0u8; (size * size * 4) as usize];
        let lines = GetDIBits(
            hdc,
            hbitmap,
            0,
            size as u32,
            Some(bgra_pixels.as_mut_ptr() as *mut _),
            &mut bmi,
            DIB_RGB_COLORS,
        );

        SelectObject(hdc, old_obj);
        let _ = DeleteObject(hbitmap.into());
        let _ = DeleteDC(hdc);

        if lines == 0 {
            return None;
        }

        // Konversi BGRA (Windows GDI) ke RGBA (Standar PNG)
        for chunk in bgra_pixels.chunks_exact_mut(4) {
            chunk.swap(0, 2); // Tukar Blue dan Red
        }

        // Encode piksel RGBA menjadi PNG di memori lalu ke Base64
        let mut png_bytes: Vec<u8> = Vec::new();
        {
            let mut cursor = std::io::Cursor::new(&mut png_bytes);
            if image::write_buffer_with_format(
                &mut cursor,
                &bgra_pixels,
                size as u32,
                size as u32,
                image::ColorType::Rgba8,
                image::ImageFormat::Png,
            )
            .is_err()
            {
                return None;
            }
        }

        use base64::{engine::general_purpose::STANDARD, Engine as _};
        let data_url = format!("data:image/png;base64,{}", STANDARD.encode(&png_bytes));

        if let Ok(mut cache) = ICON_CACHE.lock() {
            cache.insert(path_str.to_string(), data_url.clone());
            if resolved_path != path_str {
                cache.insert(resolved_path, data_url.clone());
            }
        }

        Some(data_url)
    }
}

#[cfg(not(windows))]
pub fn extract_icon_base64(_path_str: &str, _size: i32) -> Option<String> {
    None
}

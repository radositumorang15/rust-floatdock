//! Application Icon Management & Caching
//! Resolves icon representations for system apps and custom paths.

use std::collections::HashMap;
use std::sync::Mutex;

static ICON_CACHE: Mutex<Option<HashMap<String, String>>> = Mutex::new(None);

pub fn get_cached_icon(icon_name: &str) -> Option<String> {
    let mut lock = ICON_CACHE.lock().unwrap();
    if lock.is_none() {
        *lock = Some(HashMap::new());
    }
    lock.as_ref().and_then(|map| map.get(icon_name).cloned())
}

pub fn cache_icon(icon_name: &str, data_url: &str) {
    let mut lock = ICON_CACHE.lock().unwrap();
    if lock.is_none() {
        *lock = Some(HashMap::new());
    }
    if let Some(ref mut map) = *lock {
        map.insert(icon_name.to_string(), data_url.to_string());
    }
}

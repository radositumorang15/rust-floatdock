//! Weather Service via Open-Meteo
//! Queries weather conditions and temperature without requiring an API key.

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WeatherInfo {
    pub temperature: f32,
    pub condition: String,
    pub weather_code: i32,
    pub is_day: bool,
}

#[derive(Deserialize)]
struct OpenMeteoResponse {
    current: Option<OpenMeteoCurrent>,
}

#[derive(Deserialize)]
struct OpenMeteoCurrent {
    temperature_2m: Option<f32>,
    weather_code: Option<i32>,
    is_day: Option<i32>,
}

struct CachedWeather {
    info: WeatherInfo,
    fetched_at: Instant,
}

static CACHE: Mutex<Option<CachedWeather>> = Mutex::new(None);

pub async fn get_weather(lat: Option<f64>, lon: Option<f64>) -> WeatherInfo {
    // Check 30-minute cache first
    {
        let cache = CACHE.lock().unwrap();
        if let Some(ref cached) = *cache {
            if cached.fetched_at.elapsed() < Duration::from_secs(1800) {
                return cached.info.clone();
            }
        }
    }

    let latitude = lat.unwrap_or(-6.2088);
    let longitude = lon.unwrap_or(106.8456);

    let url = format!(
        "https://api.open-meteo.com/v1/forecast?latitude={:.4}&longitude={:.4}&current=temperature_2m,weather_code,is_day",
        latitude, longitude
    );

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(4))
        .build();

    let fallback = WeatherInfo {
        temperature: 30.0,
        condition: "Cerah Berawan".to_string(),
        weather_code: 1,
        is_day: true,
    };

    if let Ok(client) = client {
        if let Ok(resp) = client.get(&url).send().await {
            if let Ok(data) = resp.json::<OpenMeteoResponse>().await {
                if let Some(current) = data.current {
                    let temp = current.temperature_2m.unwrap_or(30.0);
                    let code = current.weather_code.unwrap_or(1);
                    let is_day = current.is_day.unwrap_or(1) == 1;

                    let condition = match code {
                        0 => "Cerah",
                        1..=3 => "Sebagian Berawan",
                        45 | 48 => "Berkabut",
                        51..=55 => "Gerimis",
                        61..=65 => "Hujan",
                        80..=82 => "Hujan Lebat",
                        95..=99 => "Badai Petir",
                        _ => "Cerah Berawan",
                    }
                    .to_string();

                    let info = WeatherInfo {
                        temperature: temp.round(),
                        condition,
                        weather_code: code,
                        is_day,
                    };

                    let mut cache = CACHE.lock().unwrap();
                    *cache = Some(CachedWeather {
                        info: info.clone(),
                        fetched_at: Instant::now(),
                    });

                    return info;
                }
            }
        }
    }

    fallback
}

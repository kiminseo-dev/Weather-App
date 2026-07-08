import { cache } from "react";

//* gets user latitude and longitude position
export function getUserCoord() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error.message);
      },
    );
  });
}

//returns object with country and city
export async function fetchLocationName(coord) {
  const getCountryApiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${coord.lat}&lon=${coord.lon}&format=json`;

  try {
    const response = await fetch(getCountryApiUrl);
    if (!response.ok) {
      throw new Error("Fetch Failed");
    }

    const data = await response.json();
    localStorage.setItem("cachedLocationName", JSON.stringify(data));

    return {
      nameData: {
        country: data["address"]["country"],
        city: data["address"]["city"],
      },
      source: "live",
    };
  } catch (error) {
    console.log(error);

    const cached = JSON.parse(localStorage.getItem("cachedLocationName"));
    if (cached) {
      return {
        nameData: {
          country: cached["address"]["country"],
          city: cached["address"]["city"],
        },
        source: "delayed",
      };
    }
    throw new Error("No cached data available (locationName)");
  }
}

export async function fetchLocationMatches(value) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.map((item) => ({
      name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
  } catch (error) {
    console.log(error);
    throw error;
  }
}

export async function fetchWeatherData(
  coord,
  toFetch,
  cacheKey = "cachedWeatherData",
) {
  const query = Object.entries(toFetch)
    .map(([timeFrame, variables]) => `${timeFrame}=${variables.join(",")}`)
    .join("&");

  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&${query}&timezone=auto`;

  try {
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error("Fetch failed");
    }

    const data = await response.json();
    localStorage.setItem(cacheKey, JSON.stringify(data));

    return {
      data,
      source: "live",
    };
  } catch (error) {
    console.log(error);

    const cached = JSON.parse(localStorage.getItem(cacheKey));

    if (cached) {
      return {
        data: cached,
        source: "delayed",
      };
    }

    throw new Error(`No cached data available (${cacheKey})`);
  }
}

export async function getDateTime() {
  const now = new Date();

  const date = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const time = new Intl.DateTimeFormat("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  return { date, time };
}

export function isToday(weatherData, date) {
  return weatherData.current?.time.split("T")[0] === date;
}

export function getDayIndex(weatherData, date) {
  return weatherData.daily?.time.indexOf(date);
}

export function weatherCodeToText(code) {
  const weatherCodes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };

  return weatherCodes[code];
}

export function getWeekdayShort(dateStr) {
  const date = new Date(dateStr);

  return date.toLocaleDateString("en-US", {
    weekday: "short",
  });
}

export function getWeekday(dateStr) {
  const date = new Date(dateStr);

  return date.toLocaleDateString("en-US", {
    weekday: "long",
  });
}

export function saveData(name, data) {
  localStorage.setItem(name, JSON.stringify(data));
}

export function readData(name) {
  return JSON.parse(localStorage.getItem(name)) || null;
}

export const weatherDataOptions = {
  current: [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "is_day",
    "precipitation",
    "rain",
    "showers",
    "snowfall",
    "weather_code",
    "cloud_cover",
    "pressure_msl",
    "surface_pressure",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m",
  ],

  minutely_15: [
    "temperature_2m",
    "relative_humidity_2m",
    "dew_point_2m",
    "apparent_temperature",
    "precipitation",
    "rain",
    "showers",
    "snowfall",
    "weather_code",
    "wind_speed_10m",
    "wind_direction_10m",
    "wind_gusts_10m",
    "visibility",
    "cape",
    "shortwave_radiation",
    "direct_radiation",
    "direct_normal_irradiance",
    "diffuse_radiation",
    "sunshine_duration",
  ],

  hourly: [
    "temperature_2m",
    "relative_humidity_2m",
    "dew_point_2m",
    "apparent_temperature",
    "precipitation_probability",
    "precipitation",
    "rain",
    "showers",
    "snowfall",
    "snow_depth",
    "weather_code",
    "pressure_msl",
    "surface_pressure",
    "cloud_cover",
    "cloud_cover_low",
    "cloud_cover_mid",
    "cloud_cover_high",
    "visibility",
    "evapotranspiration",
    "et0_fao_evapotranspiration",
    "vapour_pressure_deficit",

    "wind_speed_10m",
    "wind_speed_80m",
    "wind_speed_120m",
    "wind_speed_180m",

    "wind_direction_10m",
    "wind_direction_80m",
    "wind_direction_120m",
    "wind_direction_180m",

    "wind_gusts_10m",

    "temperature_80m",
    "temperature_120m",
    "temperature_180m",

    "soil_temperature_0cm",
    "soil_temperature_6cm",
    "soil_temperature_18cm",
    "soil_temperature_54cm",

    "soil_moisture_0_to_1cm",
    "soil_moisture_1_to_3cm",
    "soil_moisture_3_to_9cm",
    "soil_moisture_9_to_27cm",
    "soil_moisture_27_to_81cm",
  ],

  daily: [
    "temperature_2m_max",
    "temperature_2m_mean",
    "temperature_2m_min",
    "apparent_temperature_max",
    "apparent_temperature_mean",
    "apparent_temperature_min",
    "precipitation_sum",
    "rain_sum",
    "showers_sum",
    "snowfall_sum",
    "precipitation_hours",
    "precipitation_probability_max",
    "precipitation_probability_mean",
    "precipitation_probability_min",
    "weather_code",
    "sunrise",
    "sunset",
    "sunshine_duration",
    "daylight_duration",
    "wind_speed_10m_max",
    "wind_gusts_10m_max",
    "wind_direction_10m_dominant",
    "shortwave_radiation_sum",
    "et0_fao_evapotranspiration",
    "uv_index_max",
    "uv_index_clear_sky_max",
  ],
};

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
  try {
    const getCountryApiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${coord.lat}&lon=${coord.lon}&format=json`;

    const response = await fetch(getCountryApiUrl);
    const data = await response.json();

    return {
      country: data["address"]["country"],
      city: data["address"]["city"],
    };
  } catch (error) {
    console.log(error);
    throw error;
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

export async function fetchWeatherData(coord, toFetch) {
  const query = Object.entries(toFetch)
    .map(([timeFrame, variables]) => {
      return `${timeFrame}=${variables.join(",")}`;
    })
    .join("&");

  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&${query}&timezone=auto`;

  try {
    const response = await fetch(apiUrl);
    const data = await response.json();

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
  i;
}

export async function getDateTime({ lat, lon }) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto`,
  );

  const data = await response.json();

  const timeZone = data.timezone;

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const time = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

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

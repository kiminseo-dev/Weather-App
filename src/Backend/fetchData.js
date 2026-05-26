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
}

export async function getDate({ lat, lon }) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto`,
  );

  const data = await response.json();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: data.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function getTime({ lat, lon }) {
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto`,
  );

  const data = await response.json();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: data.timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function isToday(weatherData, date) {
  return weatherData.current?.time.split("T")[0] === date;
}

export function getDayIndex(weatherData, date) {
  return weatherData.daily?.time.indexOf(date);
}
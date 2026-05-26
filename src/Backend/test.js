const toFetch = {
    current: ["weather_code", "temperature_2m"],
    hourly: ["temperature_2m, weather_code"],
    daily: ["temperature_2m_max", "temperature_2m_min", "weather_code"],
}

async function fetchWeatherData(c, toFetch) {
    const timeFrame = Object.keys(toFetch);
    toFetch[timeFrame] 
}

fetchWeatherData("", toFetch);

const toFetch = {
  current: ["weather_code", "temperature_2m"],
  hourly: ["temperature_2m", "weather_code"],
  daily: ["temperature_2m_max", "temperature_2m_min", "weather_code"],
};

const query = Object.entries(toFetch)
  .map(([timeFrame, variables]) => {
    return `${timeFrame}=${variables.join(",")}`;
  })
  .join("&");

console.log(query);
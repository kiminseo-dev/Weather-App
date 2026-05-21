import { useState, useEffect, useMemo } from "react";
import { debounce } from "../Backend/debounce.js";
import {
  fetchLocationMatches,
  fetchLocationName,
  getUserCoord,
  fetchWeatherData,
  getDate,
  getTime,
} from "../Backend/fetchData";

function App() {
  const [coord, setCoord] = useState({});
  const [locationName, setLocationName] = useState({
    country: "loading...",
    city: "loading...",
  });
  const [weatherData, setWeatherData] = useState({});
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [locationList, setLocationList] = useState([]);
  const [searchText, setSearchText] = useState("");

  const handleDebouncedChange = useMemo(() => {
    return debounce(async (value) => {
      if (!value.trim()) {
        setLocationList([]);
        return;
      }

      const matches = await fetchLocationMatches(value);
      setLocationList(matches);
    }, 300);
  }, []);

  async function initData() {
    const c = await getUserCoord();
    setCoord(c);

    const data = await fetchLocationName(c);
    setLocationName(data);

    const today = await getDate(c);
    setDate(today);

    const time = await getTime(c);
    setTime(time);
    await fetchData(c);
  }

  async function fetchData(c) {
    const currentData = await fetchWeatherData(c, "current", [
      "weather_code",
      "temperature_2m",
    ]);

    const minutelyData = await fetchWeatherData(c, "minutely_15", []);

    const hourlyData = await fetchWeatherData(c, "hourly", [
      "temperature_2m",
      "weather_code",
    ]);

    const dailyData = await fetchWeatherData(c, "daily", [
      "temperature_2m_max",
      "temperature_2m_min",
      "weather_code",
    ]);

    setWeatherData({
      current: currentData,
      minutely: minutelyData,
      hourly: hourlyData,
      daily: dailyData,
    });
  }

  useEffect(() => {
    initData();
  }, []);

  const dayIdx =
    weatherData.daily?.time.indexOf(date) !== -1
      ? weatherData.daily?.time.indexOf(date)
      : 0;

  return (
    <div>
      <nav>
        <input
          value={searchText}
          onChange={(e) => {
            const value = e.target.value;
            setSearchText(value);
            handleDebouncedChange(value);
          }}
          placeholder="Type Country or City..."
        />
        {locationList.map(({ name, lat, lon }, index) => (
          <div
            key={`${lat}-${lon}-${index}`}
            onClick={async () => {
              fetchData({ lat, lon });
              setCoord({ lat, lon });
              setLocationName({
                country: name,
                city: "",
              });
              const newDate = await getDate({ lat, lon });
              setDate(newDate);

              const newTime = await getTime({ lat, lon });
              setTime(newTime);
              console.log("country updated");
            }}
            className="border"
          >
            <p>{name}</p>
            <p>{lat}</p>
            <p>{lon}</p>
          </div>
        ))}
      </nav>
      <div id="Everything">
        <h2>{locationName.country ?? "loading..."}</h2>
        <h3>{locationName.city ?? "loading..."}</h3>

        <div id="main">
          <div id="current">
            <img
              src={`./src/assets/WeatherCode/weatherCode${weatherData.daily?.weather_code[dayIdx]}.png`}
            />

            <h1>
              {weatherData.daily?.temperature_2m_max[dayIdx] ?? "loading..."}°
            </h1>
            {weatherData.daily ? (
              weatherData.daily.time
                .map((date, index) => ({
                  date: weatherData.daily["time"][index],
                  max: weatherData.daily["temperature_2m_max"][index],
                  min: weatherData.daily["temperature_2m_min"][index],
                }))
                .filter((today) => today.date === date)
                .map((today) => (
                  <div key={`${today.date}-${today.max}-${today.min}`}>
                    <p>
                      High: {weatherData.daily?.temperature_2m_max[dayIdx]}°
                    </p>
                    <p>Low: {weatherData.daily?.temperature_2m_min[dayIdx]}°</p>
                  </div>
                ))
            ) : (
              <p>Loading...</p>
            )}
          </div>

          <div id="info">
            <h3>Weather</h3>
            <p>{date ?? "loading..."}</p>
            <p>{time ?? "loading..."}</p>
            <p>
              {weatherData.current?.["weather_code"] ?? "loading..."} as text
            </p>
          </div>

          <div>
            <h3>
              <strong>Today</strong>
            </h3>
            {weatherData.hourly ? (
              weatherData.hourly.time
                .map((time, index) => ({
                  time: weatherData.hourly["time"][index],
                  weatherCode: weatherData.hourly["weather_code"][index],
                  temperature: weatherData.hourly["temperature_2m"][index],
                }))
                .filter((hour) => hour.time.startsWith(date))
                .map((hour) => (
                  <div key={hour.time} className="border">
                    <p>{hour.time}</p>
                    <img
                      src={`./src/assets/WeatherCode/weatherCode${hour.weatherCode}.png`}
                    />
                    <p>{hour.temperature}</p>
                  </div>
                ))
            ) : (
              <p>loading...</p>
            )}
          </div>
        </div>

        <div id="sevendayPrediction">
          <h3>
            <strong>7 day forecast</strong>
          </h3>
          {weatherData.daily ? (
            weatherData.daily.time.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="border"
                onClick={() => {
                  setDate(day);
                  console.log("hourly forecast updated");
                }}
              >
                <p>{day}</p>
                <img
                  src={`./src/assets/WeatherCode/weatherCode${weatherData.daily["weather_code"][index]}.png`}
                />
                <p>{weatherData.daily["temperature_2m_max"][index]}</p>
                <p>{weatherData.daily["temperature_2m_min"][index]}</p>
              </div>
            ))
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <div id="moreInfo"></div>
      </div>
    </div>
  );
}

export default App;

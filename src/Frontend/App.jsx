import { useState, useEffect, useMemo } from "react";
import { debounce } from "../Backend/debounce.js";
import {
  fetchLocationMatches,
  fetchLocationName,
  getUserCoord,
  fetchWeatherData,
  getDateTime,
  isToday,
  getDayIndex,
  weatherCodeToText,
} from "../Backend/fetchData";
import { SkeletonImage } from "./util.jsx";

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

  const [iconLoaded, setIconLoaded] = useState(false);
  const [weatherDataSource, setWeatherDataSource] = useState("live");
  const [nameDataSource, setNameDataSource] = useState("live");

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
    setLocationName(data.nameData);
    setNameDataSource(data.source);

    const dateTime = await getDateTime(c);
    setDate(dateTime.date);
    setTime(dateTime.time);

    await fetchData(c);
  }

  async function fetchData(c) {
    const fetchedWeatherData = await fetchWeatherData(c, {
      current: ["weather_code", "temperature_2m"],
      hourly: ["temperature_2m", "weather_code"],
      daily: ["temperature_2m_max", "temperature_2m_min", "weather_code"],
    });

    setWeatherData(fetchedWeatherData.data);
    setWeatherDataSource(fetchedWeatherData.source);
  }

  useEffect(() => {
    initData();
  }, []);

  useEffect(() => {
    if (!coord?.lat || !coord?.lon) return;

    const intervalId = setInterval(async () => {
      if (!isToday(weatherData, date)) return;

      const dateTime = await getDateTime(coord);
      setDate(dateTime.date);
      setTime(dateTime.time);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [coord, weatherData, date]);

  const today = isToday(weatherData, date);
  const dayIndex = getDayIndex(weatherData, date);

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
              const dateTime = await getDateTime({ lat, lon });

              setDate(dateTime.date);
              setTime(dateTime.time);
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
        {locationName.country ? (
          <h2>{locationName.country}</h2>
        ) : (
          <div>loading...</div>
        )}

        {locationName.city ? (
          <h3>{locationName.city}</h3>
        ) : (
          <div>loading...</div>
        )}

        <p>{nameDataSource}</p>

        <div id="main">
          <div id="current">
            {today ? (
              <SkeletonImage
                src={`./src/assets/WeatherCode/weatherCode${weatherData.current?.["weather_code"]}.png`}
              />
            ) : (
              <SkeletonImage
                src={`./src/assets/WeatherCode/weatherCode${weatherData.daily?.["weather_code"][dayIndex]}.png`}
              />
            )}

            {weatherData.current?.["temperature_2m"] &&
            weatherData.daily?.["temperature_2m_max"] ? (
              <h1>
                {today
                  ? weatherData.current?.["temperature_2m"]
                  : weatherData.daily?.["temperature_2m_max"][dayIndex]}
              </h1>
            ) : (
              <div>loading...</div>
            )}

            {weatherData.daily?.temperature_2m_max &&
            weatherData.daily?.temperature_2m_min ? (
              <div>
                <p>{weatherData.daily?.temperature_2m_max[dayIndex]}</p>
                <p>{weatherData.daily?.temperature_2m_min[dayIndex]}</p>
              </div>
            ) : (
              <div>loading...</div>
            )}
          </div>

          <div id="info">
            <h3>Weather</h3>
            {date ? <p>{date}</p> : <div>loading...</div>}
            {time ? <p>{time}</p> : <div>loading...</div>}

            <p>{weatherDataSource}</p>

            {weatherData.current?.["weather_code"] !== undefined &&
            weatherData.daily?.["weather_code"] ? (
              <p>
                {today
                  ? weatherCodeToText(weatherData.current?.["weather_code"])
                  : weatherCodeToText(
                      weatherData.daily?.["weather_code"][dayIndex],
                    )}
              </p>
            ) : (
              <div>loading...</div>
            )}
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
              <div>loading...</div>
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
            <div>loading...</div>
          )}
        </div>
        <div id="moreInfo"></div>
      </div>
    </div>
  );
}

export default App;

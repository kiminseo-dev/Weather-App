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
import { weatherIcon } from "../Backend/importImage.js";

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

  const [isOpen, setIsOpen] = useState(false);

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
    <div className="bg-black p-2">
      <nav className="flex items-center gap-5">
        <a href="#main-weather-display">
          <img src="logo" />
        </a>
        <input
          onClick={() => setIsOpen(true)}
          placeholder="Search..."
          className="w-60 h-8 rounded-xl"
        />
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => {
              setIsOpen(false);
              setSearchText("");
              setLocationList([]);
            }}
          >
            <div
              className="bg-white p-4 rounded-lg w-[400px] max-h-[70vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                value={searchText}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchText(value);
                  handleDebouncedChange(value);
                }}
                placeholder="Type Country or City..."
                className="w-full border p-2 mb-3"
                autoFocus
              />

              {locationList.map(({ name, lat, lon }, index) => (
                <div
                  key={`${lat}-${lon}-${index}`}
                  onClick={async () => {
                    fetchData({ lat, lon });
                    setCoord({ lat, lon });
                    setLocationName({ country: name, city: "" });

                    const dateTime = await getDateTime({ lat, lon });
                    setDate(dateTime.date);
                    setTime(dateTime.time);

                    setSearchText("");
                    setIsOpen(false);
                    setLocationList([]);
                  }}
                  className="border p-2 cursor-pointer hover:bg-gray-100"
                >
                  <p>{name}</p>
                  <p>{lat}</p>
                  <p>{lon}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>
      <main id="main-weather-display">
        {locationName.country !== undefined ? (
          <h1>{locationName.country}</h1>
        ) : (
          <div>loading...</div>
        )}

        {locationName.city !== undefined ? (
          <h2>{locationName.city}</h2>
        ) : (
          <div>loading...</div>
        )}

        <p>{nameDataSource}</p>

        <div id="main">
          <div id="current">
            {today ? (
              <SkeletonImage
                src={weatherIcon[weatherData.current?.["weather_code"]]}
                alt="weater code icon"
                width="50px"
                height="50px"
              />
            ) : (
              <SkeletonImage
                src={weatherIcon[weatherData.daily?.["weather_code"][dayIndex]]}
                alt="weater code icon"
                width="50px"
                height="50px"
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
            <h2>Weather</h2>
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
            <h2>
              <strong>Today</strong>
            </h2>
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
                      src={weatherIcon[hour.weatherCode]}
                      width="50"
                      height="50"
                      alt="weather code icon"
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
          <h2>
            <strong>7 day forecast</strong>
          </h2>
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
                  src={weatherIcon[weatherData.daily["weather_code"][index]]}
                  width="50"
                  height="50"
                  alt="weather code icon"
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
      </main>
    </div>
  );
}

export default App;

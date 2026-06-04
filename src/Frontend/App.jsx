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
import {
  weatherIcon,
  magnifiyingGlass,
  logo,
  backgrounds,
} from "../Backend/importImage.js";

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
    <div>
      <div
        style={{ backgroundImage: `url(${backgrounds.mainlyClearSky})` }}
        className="h-screen w-full bg-cover bg-center bg-no-repeat p-2"
      >
        <nav className="flex items-center gap-5 h-10 pr-2">
          <a href="#main-weather-display">
            <img src={logo} width="50px" height="50px" className="opacity-70" />
          </a>
          <div
            onClick={() => setIsOpen(true)}
            className="cursor-text flex items-center gap-2 p-1 pl-2 w-80 h-8 rounded-2xl ml-auto max-md:border-0 max-md:w-[40px] max-md:h-[40px] max-md:cursor-pointer max-md:bg-transparent bg-black/30 border border-white/10"
          >
            <img
              src={magnifiyingGlass}
              className="w-[20px] h-[20px] max-md:h-[30px] max-md:w-[30px] opacity-70"
            />
            <p className="text-white/70 text-sm max-md:hidden">Search...</p>
          </div>
          {isOpen && (
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              <div
                className="bg-black/30 border border-white/10 rounded-lg w-[500px] max-sm:w-[95%] overflow-hidden min-h-[120px]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2 p-2">
                  <img
                    src={magnifiyingGlass}
                    width="20px"
                    height="20px"
                    className="opacity-70"
                  />
                  <input
                    value={searchText}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchText(value);
                      handleDebouncedChange(value);
                    }}
                    placeholder="Type Country or City..."
                    className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 caret-white/70 placeholder-white/70 p-0 placeholder:text-sm text-white/70"
                    autoFocus
                  />
                </div>

                <div className="border border-white/10 w-[100%]"></div>

                {locationList.length === 0 && (<p className="text-white/50 text-center mt-5">No results</p>)}

                <div className="max-h-[50vh] overflow-y-auto ">
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
                      className="border border-white/10 p-2 cursor-pointer hover:bg-black/20"
                    >
                      <p className="text-white/70 text-m font-medium">{name}</p>
                      <p className="text-white/70 text-sm">Latitude: {lat}</p>
                      <p className="text-white/70 text-sm">Longitude: {lon}</p>
                    </div>
                  ))}
                </div>
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
                  src={
                    weatherIcon[weatherData.daily?.["weather_code"][dayIndex]]
                  }
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
    </div>
  );
}

export default App;

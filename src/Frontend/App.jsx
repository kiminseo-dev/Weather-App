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
  getWeekdayShort,
  getWeekday,
  saveRecentSearch,
  readRecentSearch,
  weatherDataOptions,
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
  const [locationName, setLocationName] = useState({});
  const [weatherData, setWeatherData] = useState({});
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [locationList, setLocationList] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [iconLoaded, setIconLoaded] = useState(false);
  const [weatherDataSource, setWeatherDataSource] = useState("live");
  const [nameDataSource, setNameDataSource] = useState("live");

  const [isOpen, setIsOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [searchBar, setSearchBar] = useState(false);

  const [recentSearch, setRecentSearch] = useState(readRecentSearch() || []);

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

  useEffect(() => {
    saveRecentSearch(recentSearch);
  }, [recentSearch]);

  useEffect(() => {
    const recentSearchData = readRecentSearch();
    setRecentSearch(recentSearchData);
  }, []);

  const today = isToday(weatherData, date);
  const dayIndex = getDayIndex(weatherData, date);

  return (
    <div>
      <div
        style={{ backgroundImage: `url(${backgrounds.mainlyClearSky})` }}
        className="h-screen w-full bg-cover bg-center bg-no-repeat p-2 overflow-x-hidden"
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
                className="bg-black/50 border border-white/10 rounded-lg w-[500px] max-sm:w-[95%] overflow-hidden min-h-[120px]"
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
                  {nameDataSource === "live" ? (
                    <div className="flex items-center gap-1">
                      <div className="w-[4px] h-[4px] rounded-full bg-emerald-400 animate-pulse"></div>
                      <p className="text-emerald-400">Live</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="w-[4px] h-[4px] rounded-full bg-amber-500 animate-pulse"></div>
                      <p className="text-amber-500">Delayed</p>
                    </div>
                  )}
                </div>

                <div className="border border-white/10 w-[100%]"></div>

                {locationList.length === 0 && (
                  <p className="text-white/50 text-center mt-5">No results</p>
                )}

                <div className="max-h-[50vh] overflow-y-auto ">
                  {locationList.map(({ name, lat, lon }, index) => (
                    <div
                      key={`${lat}-${lon}-${index}`}
                      onClick={async () => {
                        fetchData({ lat, lon });
                        setCoord({ lat, lon });
                        setLocationName({
                          country: name.split(",")[0],
                          city: name.split(",").slice(1).join(","),
                        });

                        const dateTime = await getDateTime({ lat, lon });
                        setDate(dateTime.date);
                        setTime(dateTime.time);

                        setRecentSearch((prev) => [
                          {
                            name,
                            lat,
                            lon,
                          },
                          ...prev,
                        ]);

                        setSearchText("");
                        setIsOpen(false);
                        setLocationList([]);
                      }}
                      className="border-b border-white/10 p-2 cursor-pointer hover:bg-black/20"
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
        <main id="main-weather-display" className="mt-4">
          <div className="flex items-center gap-5">
            <div className="flex flex-col gap-[2px] pl-1">
              <div className="h-[20px] flex items-center">
                {locationName.country !== undefined ? (
                  <h1 className="text-xl font-medium text-white leading-none">
                    {locationName.country}
                  </h1>
                ) : (
                  <div className="h-[20px] w-[120px] rounded bg-black/40 animate-pulse"></div>
                )}
              </div>

              <div className="h-[18px] flex items-center">
                {locationName.city !== undefined ? (
                  <h2 className="text-lg text-white/80 overflow-hidden leanding-none">
                    {locationName.city}
                  </h2>
                ) : (
                  <div className="h-[18px] w-[175px] rounded bg-black/30 animate-pulse"></div>
                )}
              </div>
            </div>

            {weatherDataSource === "live" ? (
              <div className="flex items-center gap-1 bg-emerald-400/30 border border-emerald-400 p-4 w-18 h-7 justify-center rounded-full">
                <div className="bg-emerald-400 w-2 h-2 rounded-xl animate-pulse"></div>
                <p className="text-emerald-400 text-sm font-medium">Live</p>
              </div>
            ) : (
              <div className="flex items-center gap-1 p-4 w-25 h-7 justify-center rounded-full bg-amber-500/30 border border-amber-500">
                <div className="bg-amber-500 w-2 h-2 rounded-xl animate-pulse"></div>
                <p className="text-sm font-medium text-amber-500">Delayed</p>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2 flex-1">
            <div className="w-[70%] flex flex-col gap-3">
              <div
                id="main"
                className="border border-white/10 p-3 bg-black/30 rounded-xl"
              >
                <div className="flex">
                  <div id="current" className="flex gap-2">
                    {today ? (
                      <SkeletonImage
                        src={weatherIcon[weatherData.current?.["weather_code"]]}
                        alt="weater code icon"
                        width="70px"
                        height="70px"
                      />
                    ) : (
                      <SkeletonImage
                        src={
                          weatherIcon[
                            weatherData.daily?.["weather_code"][dayIndex]
                          ]
                        }
                        alt="weater code icon"
                        width="70px"
                        height="70px"
                      />
                    )}

                    <div>
                      <div>
                        {weatherData.current?.["temperature_2m"] &&
                        weatherData.daily?.["temperature_2m_max"] ? (
                          <h1 className="text-3xl font-medium text-white h-[30px] leading-none">
                            {today
                              ? weatherData.current?.["temperature_2m"]
                              : weatherData.daily?.["temperature_2m_max"][
                                  dayIndex
                                ]}
                            °
                          </h1>
                        ) : (
                          <div className="w-[70px] h-[30px] rounded bg-black/40 animate-pulse"></div>
                        )}
                      </div>

                      <div className="mt-1">
                        {weatherData.daily?.temperature_2m_max &&
                        weatherData.daily?.temperature_2m_min ? (
                          <div className="flex gap-2">
                            <p className="text-white/70 h-[16px] leading-none">
                              {weatherData.daily?.temperature_2m_max[dayIndex]}°
                            </p>
                            <p className="text-white/50 h-[16px] leading-none">
                              {weatherData.daily?.temperature_2m_min[dayIndex]}°
                            </p>
                          </div>
                        ) : (
                          <div className="h-[16px] w-[90px] rounded bg-black/40 animate-pulse"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    id="info"
                    className="ml-auto flex flex-col gap-1 items-end"
                  >
                    <h2 className="text-white text-xl h-[20px] mb-1">
                      Weather
                    </h2>
                    {date ? (
                      <p className="text-white/70 h-[16px] leading-none">
                        {date}
                      </p>
                    ) : (
                      <div className="h-[16px] w-[100px] rounded bg-black/40 animate-pulse"></div>
                    )}
                    {time ? (
                      <p className="text-white/70 h-[16px] leading-none">
                        {time}
                      </p>
                    ) : (
                      <div className="h-[16px] w-[55px] rounded bg-black/40 animate-pulse"></div>
                    )}

                    {weatherData.current?.["weather_code"] !== undefined &&
                    weatherData.daily?.["weather_code"] ? (
                      <p className="text-white/70 h-[16px] leading-none">
                        {today
                          ? weatherCodeToText(
                              weatherData.current?.["weather_code"],
                            )
                          : weatherCodeToText(
                              weatherData.daily?.["weather_code"][dayIndex],
                            )}
                      </p>
                    ) : (
                      <div className="h-[16px] w-[70px] rounded bg-black/40 animate-pulse"></div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-medium text-white">
                    {getWeekday(date)}
                  </h2>
                  <div className="flex overflow-x-auto gap-1 mt-2 pb-2">
                    {weatherData.hourly ? (
                      weatherData.hourly.time
                        .map((time, index) => ({
                          time: weatherData.hourly["time"][index],
                          weatherCode:
                            weatherData.hourly["weather_code"][index],
                          temperature:
                            weatherData.hourly["temperature_2m"][index],
                        }))
                        .filter((hour) => hour.time.startsWith(date))
                        .map((hour) => (
                          <div
                            key={hour.time}
                            className="flex flex-col items-center border border-white/10 rounded bg-black/30 p-5 gap-1"
                          >
                            <p className="text-white/70">
                              {hour.time.split("T")[1]}
                            </p>
                            <img
                              src={weatherIcon[hour.weatherCode]}
                              width="50"
                              height="50"
                              alt="weather code icon"
                            />
                            <p className="text-white">{hour.temperature}°</p>
                          </div>
                        ))
                    ) : (
                      <div className="w-[100%] h-[130px] bg-black/40 rounded animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>

              <div
                id="sevendayPrediction"
                className="bg-black/30 rounded-xl p-3 border border-white/10"
              >
                <h2 className="text-xl font-medium text-white">
                  7 day forecast
                </h2>
                <div className="flex mt-2 gap-2 overflow-x-auto pb-2">
                  {weatherData.daily ? (
                    weatherData.daily.time.map((day, index) => (
                      <div
                        key={`${day}-${index}`}
                        className={`bg-black/30 ${day === date ? "bg-black/60" : ""} rounded-lg p-3 flex flex-col items-center gap-3 ${day !== date ? "hover:bg-black/40" : ""} border border-white/10 cursor-pointer w-[150px] flex-shrink-0`}
                        onClick={() => {
                          setDate(day);
                          console.log("hourly forecast updated");
                        }}
                      >
                        <p className="text-white font-medium">
                          {getWeekdayShort(day)}
                        </p>
                        <img
                          src={
                            weatherIcon[
                              weatherData.daily["weather_code"][index]
                            ]
                          }
                          width="50"
                          height="50"
                          alt="weather code icon"
                        />
                        <div className="flex gap-2">
                          <p className="text-white">
                            {weatherData.daily["temperature_2m_max"][index]}°
                          </p>
                          <p className="text-white/70">
                            {weatherData.daily["temperature_2m_min"][index]}°
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="w-[100%] h-[140px] bg-black/40 rounded animate-pulse"></div>
                  )}
                </div>
              </div>
            </div>
            <div id="moreInfo" className="bg-black/30 rounded-xl w-[30%] p-3">
              <h2 className="text-xl font-medium text-white">Activity</h2>
              <div>
                <h2 className="text-lg text-white">More Info</h2>
                <div className="hidden">
                  {Object.entries(weatherDataOptions).map(
                    ([group, options]) => (
                      <div key={group}>
                        <h2>{group}</h2>

                        {options.map((option) => (
                          <p key={option}>{option}</p>
                        ))}
                      </div>
                    ),
                  )}
                </div>
                <div
                  className="cursor-pointer"
                  onClick={() => {
                    setIsMoreOpen(true);
                  }}
                >
                  Add
                </div>
                {isMoreOpen && (
                  <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
                    onClick={() => {
                      setIsMoreOpen(false);
                    }}
                  >
                    <div
                      className="bg-black/50 border border-white/10 rounded-lg w-[500px] max-sm:w-[95%] overflow-hidden min-h-[120px]"
                      onClick={(e) => e.stopPropagation()}
                    ></div>
                  </div>
                )}
              </div>
              <div id="recent">
                <h2 className="text-lg text-white">Recent Search</h2>
                {recentSearch.map(({ name, lat, lon }, index) => (
                  <div
                    key={`${name}-${lat}-${lon}`}
                    onClick={async () => {
                      fetchData({ lat, lon });
                      setCoord({ lat, lon });
                      setLocationName({
                        country: name.split(",")[0],
                        city: name.split(",").slice(1).join(","),
                      });

                      const dateTime = await getDateTime({ lat, lon });
                      setDate(dateTime.date);
                      setTime(dateTime.time);
                    }}
                  >
                    <p>{name.split(",")[0]}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearch((prev) =>
                          prev.filter((_, i) => i !== index),
                        );
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

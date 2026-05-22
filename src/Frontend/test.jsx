function test() {
  const isToday = weatherData.current?.["time"].split("T")[0] === date;
  const dayIndex = weatherData.daily.time.indexOf(date);

  return (
    <div id="current">
      <img
        src={
          isToday
            ? `./src/assets/WeatherCode/weatherCode${weatherData.current?.["weather_code"]}.png`
            : `./src/assets/WeatherCode/weatherCode${weatherData.daily?.["weather_code"][dayIndex]}.png`
        }
      />
      <h1>
        {isToday
          ? weatherData.current?.["temperature_2m"]
          : weatherData.daily?.["temperature_2m_max"][dayIndex]}
      </h1>
      <div>
        <p>{weatherData.daily?.temperature_2m_max[dayIndex]}</p>
        <p>{weatherData.daily?.temperature_2m_min[dayIndex]}</p>
      </div>
    </div>
  );
}

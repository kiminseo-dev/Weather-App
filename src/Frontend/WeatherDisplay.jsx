import { useEffect, useState } from "react";

function WeatherDisplay() {
    const [weatherRn, setWeatherRn] = useState(null);

    useEffect(() => {
        const fetchWeather = async () => {
            const url = "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m&models=knmi_seamless&forecast_days=3"

            try {
                const response = await fetch(url);
                const data = await response.json();
                const temperature = data.hourly.temperature_2m;

                setWeatherRn(temperature[temperature.length - 1]);
            } catch {
                console.error("Error fetching weather:", error);
            }
        }

        fetchWeather();
    }, []);

    return (
        <>
         <p>{weatherRn}</p>
        </>
    );
}

export { WeatherDisplay };
import { useState, useEffect, useMemo } from "react"
import { debounce } from "../Backend/debounce.js"
import { fetchLocationMatches, fetchLocationName, getUserCoord, fetchWeatherData } from "../Backend/fetchData";


function App() {
const [coord, setCoord] = useState({});
const [locationName, setLocationName] = useState({
    country: "loading...",
    city: "loading...",
});
const [weatherData, setWeatherData] = useState(null);
const [locationList, setLocationList] = useState([]);
const [searchText, setSerachText] = useState("");

const handleDebouncedChange = useMemo(() => {
    return debounce(async (value) => {
        const matches = await fetchLocationMatches(value);
        setLocationList(matches);
    }, 300);
  }, []);

async function initData() {
    const c = await getUserCoord();
    setCoord(c);
    
    const data = await fetchLocationName(c);
    setLocationName(data);
    fetchData(c);
}

async function fetchData(c) {
   const hourlyData = await fetchWeatherData(c, "hourly", ["temperature_2m", "weather_code"]);
}

useEffect(() => {
    initData();
}, []);

return (
      <div>
        <nav>
            <input 
                value={searchText}   
                onChange={(e) => {
                    const value = e.target.value;
                    setSerachText(value);
                    handleDebouncedChange(value);
                }}  
                placeholder="Type Country or City..."
            />
            {locationList.map(({name, lat, lon}) =>
                (
                <div key={`${lat}-${lon}`}>
                 <p>{name}</p>
                 <p>{lat}</p>
                 <p>{lon}</p>
                </div>
                )
            )}
        </nav>
        <div>
            <h1>{locationName.country}</h1> 
            <h2>{locationName.city}</h2>
            <div>
                <p></p>
            </div>
        </div>
      </div>
    );
}

export default App

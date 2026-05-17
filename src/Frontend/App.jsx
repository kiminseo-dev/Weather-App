import { useState, useEffect, useMemo } from "react"
import { getUserCountry } from "../Backend/fetchData.js"
import { debounce } from "../Backend/debounce.js"
import { fetchCoordfromName } from "../Backend/fetchData";


function App() {
const [country, setCountry] = useState("loading...");
const [city, setCity] = useState("loading...");
const [text, setText] = useState("");
const [countryList, setCountryList] = useState([]);


useEffect(() => {
    async function getLocalCountry() {
        const data = await getUserCountry();
        setCountry(data.country);
        setCity(data.city);
    }

    getLocalCountry();
}, []);

const handleDebouncedChange = useMemo(() => {
    return debounce(async (value) => {
        const data = await fetchCoordfromName(value);
        setCountryList(data);
    }, 300);
  }, []);

return (
      <div>
        <nav>
            <input 
                value={text}   
                onChange={(e) => {
                    const value = e.target.value;
                    setText(value);
                    handleDebouncedChange(value);
                }}  
                placeholder="Type Country or City..."
            />
            {/* Todo: Fix this to proper elements */}
            {countryList.map(({name, lat, lon}) =>
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
            <h1>{country}</h1> 
            <h2>{city}</h2>
            <div></div>
            <div></div>
            <div></div>
        </div>
      </div>
    );
}

export default App

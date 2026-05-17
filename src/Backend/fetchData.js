//* gets user latitude and longitude position
function getUserLocation() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        reject(error.message);
      },
    );
  });
}

// uses user location to fetch get the correct api URL
async function getApiUrl() {
  try {
    const coord = await getUserLocation();

    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}`;

    return apiUrl;
  } catch (error) {
    console.log(error);
    throw error;
  }
}

//returns object with country and city
export async function getUserCountry() {
    try {
        const coord = await getUserLocation();
        
        const getCountryApiUrl = `https://nominatim.openstreetmap.org/reverse?lat=${coord.lat}&lon=${coord.lon}&format=json`;

        const response = await fetch(getCountryApiUrl);

        const data = await response.json();

        return {
            country: data.address.country,
            city: data.address.city,
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const currentLocationButton = document.getElementById('currentLocationButton');
    const searchLocationInput = document.getElementById('inputLocationSearch');
    const searchButton = document.getElementById('locationSearchButton');
    const dashboard = document.getElementById('dashboard');
    const todayContainer = document.getElementById('todayContainer');
    const tomorrowContainer = document.getElementById('tomorrowContainer');

    // Event listeners
    currentLocationButton.addEventListener('click', getCurrentLocation);
    searchButton.addEventListener('click', searchLocation);

    // Function to get current location
    function getCurrentLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    getSunriseSunsetData(latitude, longitude);
                },
                (error) => {
                    showError("Error getting current location.");
                }
            );
        } else {
            showError("Geolocation is not supported by your browser.");
        }
    }

    // Function to search for a location
    function searchLocation() {
        const location = searchLocationInput.value.trim();
        if (location !== '') {
            const geocodeApiUrl = `https://geocode.maps.co/search?q=${encodeURIComponent(location)}`;
            fetch(geocodeApiUrl)
                .then(response => response.json())
                .then(data => {
                    if (!data.length) return alert('Please enter a valid location');
                    const { lat, lon } = data[0];
                    getSunriseSunsetData(lat, lon);
                })
                .catch(() => {
                    showError("An error occurred while fetching the coordinates!");
                });
        } else {
            showError("Please enter a location.");
        }
    }

    // Function to fetch sunrise, sunset, and additional data for both today and tomorrow
    function getSunriseSunsetData(latitude, longitude) {
        const todayDate = new Date();
        const todayApiUrl = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${todayDate.toISOString().split('T')[0]}&formatted=0`;
        
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowApiUrl = `https://api.sunrisesunset.io/json?lat=${latitude}&lng=${longitude}&date=${tomorrowDate.toISOString().split('T')[0]}&formatted=0`;
    
        Promise.all([
            fetch(todayApiUrl).then(response => response.json()),
            fetch(tomorrowApiUrl).then(response => response.json()).catch(() => null) // Handle the case where tomorrow's data is not available
        ])
        .then(([todayData, tomorrowData]) => {
            updateDashboard(todayData.results, tomorrowData ? tomorrowData.results : null);
        })
        .catch((error) => {
            showError("Error getting sunrise and sunset data.");
        });
    }

    // Function to update the dashboard with sunrise and sunset data
    function updateDashboard(todayData, tomorrowData) {
        const todayDate = new Date();
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);

        todayContainer.innerHTML = generateDayHTML("Today", todayDate, todayData.sunrise, todayData.sunset, todayData.dawn, todayData.dusk, todayData.day_length, todayData.solar_noon, todayData.timezone);
        tomorrowContainer.innerHTML = generateDayHTML("Tomorrow", tomorrowDate, tomorrowData.sunrise, tomorrowData.sunset, tomorrowData.dawn, tomorrowData.dusk, tomorrowData.day_length, tomorrowData.solar_noon, tomorrowData.timezone);

        tomorrowContainer.classList.remove('hidden');
        dashboard.classList.remove('hidden');

        searchLocationInput.value = '';
    }

    // Function to generate HTML for each day
    function generateDayHTML(day, date, sunrise, sunset, dawn, dusk, dayLength, solarNoon, timezone) {
        return `
            <div class="containerHeader">${day}<br>${formatDate(date)}</div>
            <img src="https://sunrisesunset.io/wp-content/uploads/2022/03/sunrise-5.svg" alt="Sunrise ${day}">
            <p>Sunrise ${day}: ${sunrise}</p>
            <p>Dawn ${day}: ${dawn}</p>
            <p>Day Length ${day}: ${dayLength}</p>
            <p>Solar Noon ${day}: ${solarNoon}</p>
            <p>TimeZone of ${searchLocationInput.value}: ${timezone}</p>
            <img src="https://sunrisesunset.io/wp-content/uploads/2022/03/sunset-5.svg" alt="Sunset ${day}">
            <p>Sunset ${day}: ${sunset}</p>
            <p>Dusk ${day}: ${dusk}</p>
        `;
    }

    // Function to format a date
    function formatDate(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    // Function to show an error message in the dashboard
    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('errorMessage');
        errorDiv.textContent = message;
        dashboard.innerHTML = '';
        dashboard.appendChild(errorDiv);
        dashboard.classList.remove('hidden');
    }
});
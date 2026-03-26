
import { createContext, useState, useEffect } from 'react';
import LocationPopup from '../components/LocationPopup';

export const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState(null); // New state for forecast
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState(null); // { lat, lon, name }
    const [showLocationPopup, setShowLocationPopup] = useState(false);

    const API_KEY = '65bffa581a844173ce5682387773a602';

    const fetchWeatherByCoords = async (lat, lon) => {
        setLoading(true);
        try {
            console.log("Fetching weather for coords:", lat, lon);

            // Parallel fetch for current weather and forecast
            const [weatherRes, forecastRes] = await Promise.all([
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`),
                fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`)
            ]);

            if (!weatherRes.ok) throw new Error("Failed to fetch weather");
            if (!forecastRes.ok) throw new Error("Failed to fetch forecast");

            const weatherData = await weatherRes.json();
            const forecastData = await forecastRes.json();

            setWeather(weatherData);
            setForecast(forecastData); // Store forecast data

            setLocation({
                lat,
                lon,
                name: weatherData.name
            });
            setLoading(false);
        } catch (err) {
            console.error("Weather fetch failed", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const requestGeolocation = () => {
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
            },
            (err) => {
                console.warn("Geolocation denied or error:", err);
                setError("Location access denied. Please enable location services.");
                setLoading(false);
            }
        );
    };

    const handleAllowLocation = () => {
        setShowLocationPopup(false);
        requestGeolocation();
    };

    const handleDenyLocation = () => {
        setShowLocationPopup(false);
        setError("Location access denied. Please enable location services to view local weather.");
        setLoading(false);
    };

    // Initial Fetch on Mount
    useEffect(() => {
        if (!navigator.geolocation) {
            setError("Geolocation not supported by this browser.");
            setLoading(false);
            return;
        }

        const checkPermissionAndFetch = async () => {
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    if (result.state === 'granted') {
                        requestGeolocation();
                        return;
                    } else if (result.state === 'denied') {
                        setError("Location access is denied in your browser settings.");
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.warn("Permissions query failed", e);
                }
            }

            // Show custom popup if permission is prompt (or unsupported)
            setShowLocationPopup(true);
            setLoading(false);
        };

        checkPermissionAndFetch();
    }, []);

    return (
        <WeatherContext.Provider value={{ weather, forecast, location, loading, error, refreshWeather: fetchWeatherByCoords }}>
            {children}
            {showLocationPopup && (
                <LocationPopup
                    onAllow={handleAllowLocation}
                    onDeny={handleDenyLocation}
                />
            )}
        </WeatherContext.Provider>
    );
};

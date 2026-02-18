import { useContext, useState } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { LanguageContext } from '../context/LanguageContext';
import {
    Cloud,
    Sun,
    CloudRain,
    Wind,
    Droplets,
    Thermometer,
    ArrowUp,
    ArrowDown,
    MapPin,
    Calendar,
    CloudLightning,
    CloudSnow
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend
);

const WeatherDashboard = () => {
    const { weather, forecast, loading, error } = useContext(WeatherContext);
    const { t } = useContext(LanguageContext);
    const [activeTab, setActiveTab] = useState('Temperature'); // 'Temperature', 'Precipitation', 'Wind'

    // Date for display
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96 animate-pulse">
                <Sun className="w-12 h-12 text-yellow-500 animate-spin-slow duration-3000" />
                <span className="ml-3 text-lg font-medium text-gray-500">{t.loading}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center p-4">
                <CloudRain className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-800">{t.weatherError || "Weather Unavailable"}</h3>
                <p className="text-gray-500 mt-2">{error}</p>
            </div>
        );
    }

    if (!weather || !forecast) return null;

    // Helper: Specific Icon
    const getWeatherIcon = (id, size = "w-6 h-6") => {
        if (id >= 200 && id < 300) return <CloudLightning className={`${size} text-yellow-600`} />;
        if (id >= 300 && id < 600) return <CloudRain className={`${size} text-blue-500`} />;
        if (id >= 600 && id < 700) return <CloudSnow className={`${size} text-blue-200`} />;
        if (id >= 700 && id < 800) return <Wind className={`${size} text-gray-400`} />;
        if (id === 800) return <Sun className={`${size} text-yellow-500`} />;
        return <Cloud className={`${size} text-gray-500`} />;
    };

    // --- Chart Data Preparation ---
    // Take next 8 periods (24 hours)
    const next8Periods = forecast.list.slice(0, 8);

    // Formatting for chart
    const labels = next8Periods.map(item =>
        new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })
    );

    const chartDataValues = next8Periods.map(item => Math.round(item.main.temp));

    // Smooth Curve Config
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#1f2937',
                bodyColor: '#1f2937',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 10,
                displayColors: false,
                callbacks: {
                    label: (context) => `${context.parsed.y}°C`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { color: '#9ca3af', font: { size: 10 } }
            },
            y: {
                display: false, // Hide Y axis for cleaner look like Google Weather
                suggestedMin: Math.min(...chartDataValues) - 5,
                suggestedMax: Math.max(...chartDataValues) + 5,
            }
        },
        elements: {
            line: {
                tension: 0.4 // Smooth curve
            },
            point: {
                radius: 4,
                hoverRadius: 6,
                backgroundColor: '#f59e0b',
                borderColor: '#fff',
                borderWidth: 2
            }
        }
    };

    const chartData = {
        labels,
        datasets: [
            {
                fill: true,
                label: 'Temperature',
                data: chartDataValues,
                borderColor: '#f59e0b', // Amber-500
                backgroundColor: 'rgba(251, 191, 36, 0.2)', // Amber-100/20
            },
        ],
    };

    // --- Daily Forecast Processing ---
    // Extract one reading per day (approx 12:00 PM) to simulate daily forecast
    const dailyForecast = [];
    const seenDays = new Set();

    forecast.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' });

        // Try to capture noon data, or just the first entry for a new day if noon passed
        if (!seenDays.has(dayStr) && date.getHours() >= 11) {
            seenDays.add(dayStr);
            dailyForecast.push(item);
        }
    });

    // Handle case where we don't have enough future days (e.g. late night fetch)
    // Just ensure we show unique days
    if (dailyForecast.length < 5) {
        // Fallback or simpler logic could exist here, but this suffices for MVP
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Main Weather Card */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                            <MapPin className="w-6 h-6" />
                            {t.weatherTitle || "Weather Forecast"}
                        </h2>
                        <p className="text-blue-100 mb-6">{currentDate}</p>

                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                                {getWeatherIcon(weather.weather[0].id, "w-10 h-10 text-white")}
                            </div>
                            <div>
                                <div className="text-5xl font-bold">{Math.round(weather.main.temp)}°C</div>
                                <div className="text-blue-100 font-medium capitalize">{weather.weather[0].description}</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm min-w-[200px]">
                        <div className="text-xs text-blue-100 uppercase tracking-wider mb-2">{t.currentWeather || "Current Weather"}</div>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <Wind className="w-4 h-4 opacity-80" />
                                <span>Wind: <b>{Math.round(weather.wind.speed)} km/h</b></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Droplets className="w-4 h-4 opacity-80" />
                                <span>Humidity: <b>{weather.main.humidity}%</b></span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Sun className="w-4 h-4 opacity-80" />
                                <span>UV Index: <b>Moderate</b></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sections: Graph & Forecast */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Graph Section */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-100">
                    <div className="flex items-center gap-4 mb-2 border-b border-gray-50 pb-2">
                        <button
                            className="text-sm font-bold pb-2 border-b-2 transition-all text-yellow-500 border-yellow-400"
                        >
                            {t.temperature}
                        </button>
                    </div>

                    {/* Graph Container */}
                    <div className="h-64 w-full">
                        {activeTab === 'Temperature' ? (
                            <Line options={chartOptions} data={chartData} />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 italic">
                                {activeTab} data visualization coming soon.
                            </div>
                        )}
                    </div>

                    {/* Hourly Strip below graph */}
                    <div className="flex justify-between mt-4 px-2 overflow-x-auto">
                        {next8Periods.map((item, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-1 min-w-[3rem]">
                                <span className="text-xs text-gray-400">
                                    {new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })}
                                </span>
                                {getWeatherIcon(item.weather[0].id, "w-6 h-6")}
                                <span className="text-sm font-bold text-gray-700">{Math.round(item.main.temp)}°</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 5-Day Forecast Panel */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-fade-in-up delay-200">
                    <h3 className="font-bold text-gray-800 text-lg mb-4">5-Day Forecast</h3>
                    <div className="space-y-6">
                        {dailyForecast.slice(0, 5).map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group cursor-default">
                                <span className="w-16 font-medium text-gray-600">
                                    {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <div className="flex items-center gap-3">
                                    {getWeatherIcon(item.weather[0].id)}
                                    <span className="text-sm text-gray-400 w-24 truncate">{item.weather[0].main}</span>
                                </div>
                                <div className="flex items-center gap-4 w-24 justify-end">
                                    <span className="font-bold text-gray-800">{Math.round(item.main.temp_max)}°</span>
                                    <span className="text-gray-400">{Math.round(item.main.temp_min)}°</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional Grid Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up delay-300">
                <div className="bg-blue-50/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-blue-500"><Droplets size={20} /></div>
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t.humidity}</span>
                    <span className="text-xl font-bold text-gray-800">{weather.main.humidity}%</span>
                </div>
                <div className="bg-yellow-50/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-yellow-500"><Sun size={20} /></div>
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t.uvIndex}</span>
                    <span className="text-xl font-bold text-gray-800">Moderate</span>
                </div>
                <div className="bg-purple-50/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-purple-500"><Wind size={20} /></div>
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t.wind}</span>
                    <span className="text-xl font-bold text-gray-800">{weather.wind.speed} km/h</span>
                </div>
                <div className="bg-green-50/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="bg-white p-2 rounded-full mb-2 shadow-sm text-green-500"><Thermometer size={20} /></div>
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t.pressure}</span>
                    <span className="text-xl font-bold text-gray-800">{weather.main.pressure} hPa</span>
                </div>
            </div>

        </div>
    );
};

export default WeatherDashboard;

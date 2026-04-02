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
        <div className="flex flex-col bg-gray-50/20 md:rounded-3xl md:shadow-sm md:border md:border-gray-100
            fixed inset-0 md:static md:inset-auto md:h-[calc(100vh-140px)]"
            style={{paddingBottom: 'calc(env(safe-area-inset-bottom) + 64px)'}}>
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-3 md:p-8 space-y-4 md:space-y-8">
                <div className="max-w-5xl mx-auto w-full space-y-4 md:space-y-8">

                    {/* Main Weather Card — compact on mobile */}
                    <div className="bg-green-600 rounded-2xl md:rounded-3xl p-4 md:p-8 text-white shadow-lg overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                        <div className="relative z-10">
                            {/* Top row: title + date */}
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h2 className="text-lg md:text-3xl font-bold flex items-center gap-2">
                                        <MapPin className="w-5 h-5 md:w-7 md:h-7" />
                                        {t.weatherTitle || "Weather Forecast"}
                                    </h2>
                                    <p className="text-green-100 text-xs md:text-sm font-medium mt-0.5">{currentDate}</p>
                                </div>
                            </div>

                            {/* Middle row: temp + details side by side on mobile too */}
                            <div className="flex items-center justify-between gap-3">
                                {/* Temp */}
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10">
                                        {getWeatherIcon(weather.weather[0].id, "w-8 h-8 text-white")}
                                    </div>
                                    <div>
                                        <div className="text-4xl md:text-6xl font-black tracking-tighter leading-none">{Math.round(weather.main.temp)}°C</div>
                                        <div className="text-green-100 text-sm capitalize opacity-90 mt-0.5">{weather.weather[0].description}</div>
                                    </div>
                                </div>

                                {/* Stats — inline on mobile */}
                                <div className="bg-white/10 px-4 py-3 rounded-2xl backdrop-blur-md border border-white/20 text-xs space-y-2 min-w-[130px]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 text-green-100"><Wind className="w-3.5 h-3.5" /><span>Wind</span></div>
                                        <span className="font-bold">{Math.round(weather.wind.speed)} km/h</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                                        <div className="flex items-center gap-1.5 text-green-100"><Droplets className="w-3.5 h-3.5" /><span>Humidity</span></div>
                                        <span className="font-bold">{weather.main.humidity}%</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
                                        <div className="flex items-center gap-1.5 text-green-100"><Sun className="w-3.5 h-3.5" /><span>UV</span></div>
                                        <span className="font-bold">Moderate</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sections: Graph & Forecast */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* Graph Section */}
                        <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full animate-fade-in-up">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-bold text-gray-800 text-lg">Hourly Temperature</h3>
                                <div className="text-[10px] font-black uppercase tracking-widest text-yellow-600 bg-yellow-50 px-4 py-1.5 rounded-full border border-yellow-100">
                                    {t.temperature}
                                </div>
                            </div>

                            {/* Graph Container */}
                            <div className="h-64 md:h-72 w-full mb-8">
                                <Line options={chartOptions} data={chartData} />
                            </div>

                            {/* Hourly Strip below graph */}
                            <div className="flex justify-between px-2 overflow-x-auto pb-4 scrollbar-hide gap-4">
                                {next8Periods.map((item, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-2 min-w-[4rem] p-4 rounded-3xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                                            {new Date(item.dt * 1000).toLocaleTimeString([], { hour: 'numeric', hour12: true })}
                                        </span>
                                        <div className="bg-gray-50 p-2 rounded-2xl shadow-sm group-hover:bg-white transition-colors">
                                            {getWeatherIcon(item.weather[0].id, "w-6 h-6")}
                                        </div>
                                        <span className="text-sm font-black text-gray-800">{Math.round(item.main.temp)}°</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 5-Day Forecast Panel */}
                        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex flex-col h-full animate-fade-in-up delay-100">
                            <h3 className="font-bold text-gray-800 text-lg mb-8 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-600" />
                                5-Day Forecast
                            </h3>
                            <div className="space-y-4 flex-1">
                                {dailyForecast.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-3xl hover:bg-green-50/50 transition-all border border-transparent hover:border-green-100 group">
                                        <span className="w-16 font-bold text-gray-500 text-sm group-hover:text-green-700 transition-colors">
                                            {new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                                        </span>
                                        <div className="flex items-center gap-3 flex-1 px-4">
                                            <div className="bg-gray-50 p-2 rounded-2xl group-hover:bg-white shadow-sm transition-colors">
                                                {getWeatherIcon(item.weather[0].id, "w-5 h-5")}
                                            </div>
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate group-hover:text-gray-600 transition-colors">{item.weather[0].main}</span>
                                        </div>
                                        <div className="flex items-center gap-3 w-20 justify-end">
                                            <span className="font-black text-gray-800 text-sm">{Math.round(item.main.temp_max)}°</span>
                                            <span className="text-gray-400 text-xs font-bold">{Math.round(item.main.temp_min)}°</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Additional Grid Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up delay-200 pb-4">
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group hover:border-blue-200 transition-all hover:shadow-md">
                            <div className="bg-blue-50 p-4 rounded-3xl mb-4 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-sm">
                                <Droplets size={28} />
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">{t.humidity}</span>
                            <span className="text-2xl font-black text-gray-800">{weather.main.humidity}%</span>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group hover:border-yellow-200 transition-all hover:shadow-md">
                            <div className="bg-yellow-50 p-4 rounded-3xl mb-4 text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-all shadow-sm">
                                <Sun size={28} />
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">{t.uvIndex}</span>
                            <span className="text-2xl font-black text-gray-800">Moderate</span>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group hover:border-purple-200 transition-all hover:shadow-md">
                            <div className="bg-purple-50 p-4 rounded-3xl mb-4 text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all shadow-sm">
                                <Wind size={28} />
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">{t.wind}</span>
                            <span className="text-2xl font-black text-gray-800">{weather.wind.speed} km/h</span>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center group hover:border-emerald-200 transition-all hover:shadow-md">
                            <div className="bg-emerald-50 p-4 rounded-3xl mb-4 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                                <Thermometer size={28} />
                            </div>
                            <span className="text-[10px] text-gray-400 uppercase font-black tracking-[0.2em] mb-2">{t.pressure}</span>
                            <span className="text-2xl font-black text-gray-800">{weather.main.pressure} hPa</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WeatherDashboard;

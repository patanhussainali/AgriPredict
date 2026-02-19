import { useState, useEffect, useContext } from 'react';
import { WeatherContext } from '../context/WeatherContext';
import { LanguageContext } from '../context/LanguageContext';
// import axios from 'axios';
import { Cloud, Droplets, Wind, Thermometer, Loader2, TrendingUp, RefreshCcw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PropTypes from 'prop-types';

const DashboardHome = ({ user }) => {
    // Mock Data for user name
    const userName = user?.name?.split(' ')[0] || 'User';
    const { t, lang } = useContext(LanguageContext);

    // Dynamic Date Formatting based on Language
    const currentDate = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : lang, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Weather State from Context
    const { weather, loading: loadingWeather, error: weatherError, refreshWeather, location } = useContext(WeatherContext);

    const handleRefreshWeather = () => {
        if (location && location.lat && location.lon) {
            refreshWeather(location.lat, location.lon);
        }
    };

    // Chart Data State: array of objects { year: "2020", yield: 4.5 }
    const [chartData, setChartData] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState('Rice');
    const [loadingChart, setLoadingChart] = useState(false); // Add Loading State

    useEffect(() => {
        const fetchChartData = async () => {
            setLoadingChart(true);
            try {
                // MOCK DATA FETCH
                await new Promise(r => setTimeout(r, 500)); // Simulate delay

                // Generate random trend for demo
                const years = ["2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];
                const mockData = years.map(year => ({
                    name: year,
                    value: parseFloat((Math.random() * 3 + 2).toFixed(2)) // Random yield 2-5
                }));

                setChartData(mockData);

            } catch (err) {
                console.error("Failed to fetch chart data", err);
                setChartData([]);
            } finally {
                setLoadingChart(false);
            }
        };
        fetchChartData();
    }, [selectedCrop]);

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{t.goodMorning}, {userName}</h1>
                <div className="flex justify-between items-end mt-1">
                    <p className="text-gray-500 text-sm">{t.happening}</p>
                    <span className="text-xs text-gray-400 hidden md:block">{currentDate}</span>
                </div>
            </div>

            {/* Weather Widget Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 relative overflow-hidden min-h-[250px]">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Cloud className="w-32 h-32" />
                </div>

                {/* Refresh Button */}
                <button
                    onClick={handleRefreshWeather}
                    disabled={loadingWeather}
                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white/80 rounded-full transition-all z-20 group"
                    title="Refresh Weather"
                >
                    <RefreshCcw className={`w-4 h-4 text-gray-600 ${loadingWeather ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                </button>

                {loadingWeather ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
                    </div>
                ) : weatherError ? (
                    <div className="flex items-center justify-center h-full text-red-500">
                        {weatherError}
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
                            {/* Left: Main Temp */}
                            <div>
                                <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                    {weather?.name || t.unknownLocation}
                                </div>
                                <div className="flex items-start">
                                    <span className="text-7xl font-bold text-gray-800">{Math.round(weather?.main?.temp ?? 0)}</span>
                                    <span className="text-3xl text-gray-400 mt-2">°C</span>
                                </div>
                                <p className="text-gray-500 font-medium mt-1 capitalize">{weather?.weather?.[0]?.description || t.noDescription}</p>
                            </div>

                            {/* Right: Icon (Mobile visible) */}
                            <div className="md:hidden absolute top-0 right-0">
                                <img
                                    src={`https://openweathermap.org/img/wn/${weather?.weather?.[0]?.icon || '01d'}@2x.png`}
                                    alt="weather icon"
                                    className="w-16 h-16 opacity-50"
                                />
                            </div>
                        </div>

                        {/* Weather Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-green-50 transition-colors">
                                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-bold mb-1">
                                    <Thermometer className="w-4 h-4" /> {t.feelsLike}
                                </div>
                                <span className="text-lg font-bold text-gray-800">{Math.round(weather?.main?.feels_like ?? 0)}°C</span>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-green-50 transition-colors">
                                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-bold mb-1">
                                    <Droplets className="w-4 h-4" /> {t.humidity}
                                </div>
                                <span className="text-lg font-bold text-gray-800">{weather?.main?.humidity ?? 0}%</span>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-green-50 transition-colors">
                                <div className="flex items-center gap-2 text-gray-500 text-xs uppercase font-bold mb-1">
                                    <Wind className="w-4 h-4" /> {t.windSpeed}
                                </div>
                                <span className="text-lg font-bold text-gray-800">{weather?.wind?.speed ?? 0} m/s</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Analysis Chart Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            {t.historicalYield}
                        </h2>
                        <p className="text-xs text-gray-400">{t.avgYieldYear} {selectedCrop}</p>
                    </div>

                    <div className="flex gap-2">
                        <select
                            value={selectedCrop}
                            onChange={(e) => setSelectedCrop(e.target.value)}
                            className="text-sm border-none bg-gray-50 rounded-lg px-3 py-1.5 focus:ring-0 text-gray-600 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                            <option value="Rice">Rice</option>
                            <option value="Maize">Maize</option>
                            <option value="Bajra">Bajra</option>
                            <option value="Ragi">Ragi</option>
                            <option value="Banana">Banana</option>
                            <option value="Sugarcane">Sugarcane</option>
                        </select>
                    </div>
                </div>

                {/* Recharts Area Chart */}
                <div className="h-72 w-full">
                    {loadingChart ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" />
                            Loading data...
                        </div>
                    ) : chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 30,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    dy={10}
                                />
                                <YAxis
                                    tickLine={false}
                                    axisLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    dx={-10}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#82ca9d', strokeWidth: 2 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#82ca9d"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorYield)"
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No data available for {selectedCrop}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

DashboardHome.propTypes = {
    user: PropTypes.shape({
        name: PropTypes.string,
        rollNo: PropTypes.string,
        role: PropTypes.string,
    }),
};

export default DashboardHome;

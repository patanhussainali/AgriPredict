import { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext.jsx';
import { WeatherContext } from '../context/WeatherContext';
import PredictionResult from './PredictionResult';
import {
    CloudRain,
    Thermometer,
    Droplets,
    Sprout,
    MapPin,
    Calendar,
    AlertCircle,
    CheckCircle,
    Leaf
} from 'lucide-react';
import API_URL from '../config';

const FarmerDashboard = () => {
    const { t, lang } = useContext(LanguageContext);
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    const [formData, setFormData] = useState({
        district: 'Srivilliputhur',
        crop: '',
        season: '',
        irrigation: '',
        rainfall: '',
        temp_min: '',
        temp_max: '',
        humidity: '',
        fertilizer: false, // UI requirement: Yes/No radio
        ph: '6.5', // Hidden defaults or shown when Fertilizer is Yes
        n: '140',
        p: '50',
        k: '50',
        soil_type: 'Clay Loam', // maintaining required backend field
        pulse_type: '' // Specific pulse type
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [weatherStatus, setWeatherStatus] = useState(null); // 'loading', 'success', 'error'

    const [showPulseModal, setShowPulseModal] = useState(false);
    const [currentWeather, setCurrentWeather] = useState(null);

    const { weather: globalWeather, loading: weatherLoading, error: weatherError } = useContext(WeatherContext);

    // Auto-fill form when global weather data is available
    useEffect(() => {
        if (globalWeather) {
            setCurrentWeather(globalWeather);
            setWeatherStatus('success');

            setFormData(prev => ({
                ...prev,
                district: globalWeather.name || prev.district,
                temp_min: Math.round(globalWeather.main.temp_min).toString(),
                temp_max: Math.round(globalWeather.main.temp_max).toString(),
                humidity: globalWeather.main.humidity.toString(),
                rainfall: (globalWeather.rain && globalWeather.rain['1h']) ? globalWeather.rain['1h'].toString() : '0'
            }));
        } else if (weatherError) {
            setWeatherStatus('error');
        } else if (weatherLoading) {
            setWeatherStatus('loading');
        }
    }, [globalWeather, weatherError, weatherLoading]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'crop' && value === 'Pulses') {
            setShowPulseModal(true);
        }

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePulseSelect = (type) => {
        setFormData(prev => ({ ...prev, pulse_type: type }));
        setShowPulseModal(false);
    };

    const handleRadioChange = (val) => {
        setFormData(prev => ({ ...prev, fertilizer: val === 'yes' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            // Prepare Query Params for GET request (Bypass POST issues)
            const params = new URLSearchParams({
                district: formData.district,
                crop: formData.crop || 'Rice',
                season: formData.season || 'Kharif',
                soil_type: formData.soil_type,
                rainfall: formData.rainfall || '0',
                temp_min: formData.temp_min || '0',
                temp_max: formData.temp_max || '0',
                ph: formData.ph || '6.5',
                n: formData.n || '140',
                p: formData.p || '50',
                k: formData.k || '50',
                lang: lang,
                pulse_type: formData.pulse_type || ''
            });

            // TARGET api/predict (Vercel strips extension)
            const response = await fetch(`${API_URL}/predict?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Server Error (${response.status}): ${text}`);
            }

            const data = await response.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setError(err.message || t.error);
        } finally {
            setLoading(false);
        }
    };

    const pulseTypes = [
        "Black gram", "Green Gram", "Cowpea", "Horse gram", "Red gram", "Lablab"
    ];

    return (
        <div className="space-y-6 relative">
            {/* Pulse Selection Modal */}
            {showPulseModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-fade-in-up">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Select Pulse Type</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {pulseTypes.map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => handlePulseSelect(type)}
                                    className={`
                                        p-3 rounded-lg text-sm font-medium border text-center transition-all
                                        ${formData.pulse_type === type
                                            ? 'bg-green-100 border-green-500 text-green-700'
                                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}
                                    `}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowPulseModal(false)}
                                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-gray-500 text-sm mt-1">{t.headerSub}</p>
                <div className="text-xs text-gray-400 mt-2 text-right md:-mt-6">{currentDate}</div>
            </div>

            <div className="max-w-4xl mx-auto flex flex-col gap-8 w-full">
                {/* Top Section: Form */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h2 className="text-xl font-serif font-bold text-gray-800">{t.formTitle}</h2>
                    <p className="text-sm text-gray-500 mb-6">{t.formSub}</p>

                    {/* Weather Widget */}
                    {currentWeather && (
                        <div className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img
                                    src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
                                    alt="Weather Icon"
                                    className="w-16 h-16"
                                />
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{currentWeather.name}</h3>
                                    <p className="text-sm text-gray-500 capitalize">{currentWeather.weather[0].description}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 text-center">
                                <div>
                                    <div className="flex justify-center mb-1 text-blue-500"><Thermometer size={20} /></div>
                                    <p className="font-bold text-gray-800">{Math.round(currentWeather.main.temp)}°C</p>
                                    <p className="text-xs text-gray-500">Temp</p>
                                </div>
                                <div>
                                    <div className="flex justify-center mb-1 text-blue-500"><Droplets size={20} /></div>
                                    <p className="font-bold text-gray-800">{currentWeather.main.humidity}%</p>
                                    <p className="text-xs text-gray-500">Humidity</p>
                                </div>
                                <div>
                                    <div className="flex justify-center mb-1 text-blue-500"><CloudRain size={20} /></div>
                                    <p className="font-bold text-gray-800">{formData.rainfall}mm</p>
                                    <p className="text-xs text-gray-500">Rainfall</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Weather Error Banner (Show if fetch failed) */}
                    {weatherStatus === 'error' && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 text-red-700 text-sm">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold">{t.weatherError}</p>
                                <p>{t.weatherErrorSub}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Crop Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t.crop} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="crop"
                                    value={formData.crop}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="">{t.selectCrop}</option>
                                    <option value="Rice">Rice</option>
                                    <option value="Jowar">Jowar</option>
                                    <option value="Ragi">Ragi</option>
                                    <option value="Bajra">Bajra</option>
                                    <option value="Maize">Maize</option>
                                    <option value="Pulses">Pulses</option>
                                </select>
                                {formData.crop === 'Pulses' && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="text-xs text-green-700 font-medium bg-green-50 px-2 py-1 rounded border border-green-200">
                                            {formData.pulse_type ? `Type: ${formData.pulse_type}` : 'Select Pulse Type'}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowPulseModal(true)}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            Change
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Rainfall */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.rain}</label>
                                <input
                                    type="number"
                                    name="rainfall"
                                    value={formData.rainfall}
                                    onChange={handleChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    placeholder="0"
                                    readOnly={weatherStatus === 'success' && false} // Allow edit if needed
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.location}</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <input
                                        type="text"
                                        name="district"
                                        value={formData.district}
                                        onChange={handleChange}
                                        className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. Srivilliputhur"
                                    />
                                </div>
                            </div>

                            {/* Min Temp & Max Temp (Split Grid) */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 truncate">{t.minTemp}</label>
                                    <input
                                        type="number"
                                        name="temp_min"
                                        value={formData.temp_min}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1.5 truncate">{t.maxTemp}</label>
                                    <input
                                        type="number"
                                        name="temp_max"
                                        value={formData.temp_max}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Season */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t.season} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="season"
                                    value={formData.season}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="">{t.selectSeason}</option>
                                    <option value="Kharif">Kharif</option>
                                    <option value="Rabi">Rabi</option>
                                    <option value="Zaid">Zaid</option>
                                </select>
                            </div>

                            {/* Humidity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t.humidity}</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        name="humidity"
                                        value={formData.humidity}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="0"
                                    />
                                    <div className="absolute right-3 top-2.5 text-gray-400 pointer-events-none">%</div>
                                </div>
                            </div>

                            {/* Irrigation */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    {t.irrigation} <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="irrigation"
                                    value={formData.irrigation}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="">{t.selectIrrigation}</option>
                                    <option value="Rainfed">Rainfed</option>
                                    <option value="Irrigated">Irrigated</option>
                                </select>
                            </div>

                            {/* Fertilizer Toggle */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t.fertilizer}</label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${formData.fertilizer ? 'border-green-500' : 'border-gray-300'}`}>
                                            {formData.fertilizer && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                        </div>
                                        <input type="radio" name="fertilizer" className="hidden" onChange={() => handleRadioChange('yes')} checked={formData.fertilizer} />
                                        <span className="text-sm text-gray-700">{t.yes}</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${!formData.fertilizer ? 'border-green-500' : 'border-gray-300'}`}>
                                            {!formData.fertilizer && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                        </div>
                                        <input type="radio" name="fertilizer" className="hidden" onChange={() => handleRadioChange('no')} checked={!formData.fertilizer} />
                                        <span className="text-sm text-gray-700">{t.no}</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Hidden/Collapsible Fertilizer Inputs */}
                        {formData.fertilizer && (
                            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100 grid grid-cols-3 gap-3 animate-fade-in-up">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Nitrogen (N)</label>
                                    <input type="number" name="n" value={formData.n} onChange={handleChange} className="w-full border rounded p-1.5 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Phosphorus (P)</label>
                                    <input type="number" name="p" value={formData.p} onChange={handleChange} className="w-full border rounded p-1.5 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Potassium (K)</label>
                                    <input type="number" name="k" value={formData.k} onChange={handleChange} className="w-full border rounded p-1.5 text-sm" />
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? t.loading : t.submit}
                        </button>
                    </form>

                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>

                {/* Bottom Section: Placeholder / Result */}
                <div className="w-full">
                    {result ? (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-full animate-fade-in">
                            <PredictionResult result={result} />
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 min-h-[250px] flex flex-col items-center justify-center text-center bg-gray-50/50">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <Sprout className="w-10 h-10 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{t.awaitingTitle}</h3>
                            <p className="text-sm text-gray-500 max-w-xs">{t.awaitingSub}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;

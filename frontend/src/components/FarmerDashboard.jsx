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
                <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t.formTitle}</h2>
                    <p className="text-sm text-gray-500 mb-8">{t.formSub}</p>

                    {/* Weather Widget */}
                    {currentWeather && (
                        <div className="mb-10 bg-gray-50/50 rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-white transition-all">
                            <div className="flex items-center gap-5 w-full md:w-auto">
                                <div className="bg-white p-3 rounded-full shadow-sm ring-4 ring-blue-50/50">
                                    <img
                                        src={`https://openweathermap.org/img/wn/${currentWeather.weather[0].icon}@2x.png`}
                                        alt="Weather Icon"
                                        className="w-12 h-12"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-xl font-black text-gray-800 truncate tracking-tight">{currentWeather.name}</h3>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{currentWeather.weather[0].description}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 md:gap-10 w-full md:w-auto border-t md:border-t-0 pt-6 md:pt-0 border-gray-100">
                                <div className="flex flex-col items-center group/item">
                                    <div className="bg-orange-50 p-3 rounded-full mb-2 text-orange-500 group-hover/item:bg-orange-500 group-hover/item:text-white transition-all"><Thermometer size={20} /></div>
                                    <p className="font-black text-gray-800 text-lg leading-none">{Math.round(currentWeather.main.temp)}°C</p>
                                    <p className="text-[10px] uppercase font-black text-gray-400 mt-1 tracking-widest">Temp</p>
                                </div>
                                <div className="flex flex-col items-center group/item">
                                    <div className="bg-blue-50 p-3 rounded-full mb-2 text-blue-500 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all"><Droplets size={20} /></div>
                                    <p className="font-black text-gray-800 text-lg leading-none">{currentWeather.main.humidity}%</p>
                                    <p className="text-[10px] uppercase font-black text-gray-400 mt-1 tracking-widest">Humidity</p>
                                </div>
                                <div className="flex flex-col items-center group/item">
                                    <div className="bg-emerald-50 p-3 rounded-full mb-2 text-emerald-500 group-hover/item:bg-emerald-500 group-hover/item:text-white transition-all"><CloudRain size={20} /></div>
                                    <p className="font-black text-gray-800 text-lg leading-none">{formData.rainfall}mm</p>
                                    <p className="text-[10px] uppercase font-black text-gray-400 mt-1 tracking-widest">Rainfall</p>
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
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 outline-none transition-all text-sm font-medium"
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
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 outline-none transition-all text-sm font-medium"
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
                                        className="w-full pl-10 bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 outline-none transition-all text-sm font-medium"
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
                                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 outline-none transition-all text-sm font-medium"
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
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 outline-none transition-all text-sm font-medium"
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
                                        className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 outline-none transition-all text-sm font-medium"
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
                                    className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 outline-none transition-all text-sm font-medium"
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
                                    <input type="number" name="n" value={formData.n} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-4 focus:ring-green-100 outline-none transition-all" />
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
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-4 rounded-full transition-all shadow-md hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-3 text-lg mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {loading ? t.loading : t.submit}
                        </button>
                    </form>

                    {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                </div>

                {/* Bottom Section: Placeholder / Result */}
                <div className="w-full">
                    {result ? (
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 h-full animate-fade-in">
                            <PredictionResult result={result} />
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 min-h-[300px] flex flex-col items-center justify-center text-center bg-white shadow-inner">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 ring-8 ring-green-50/50">
                                <Sprout className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-3 tracking-tight">{t.awaitingTitle}</h3>
                            <p className="text-sm font-medium text-gray-400 max-w-xs leading-relaxed">{t.awaitingSub}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FarmerDashboard;

import { useEffect, useState, useContext } from 'react';
// import axios from 'axios';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { LanguageContext } from '../context/LanguageContext.jsx';

const OfficerDashboard = () => {
    const { lang, t } = useContext(LanguageContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // For MVP: Mock data if API fails or is not ready, to prevent crash
                try {
                    const response = await fetch('http://localhost:8000/dashboard/officer');
                    if (response.ok) {
                        const data = await response.json();
                        setStats(data);
                    } else {
                        throw new Error("Failed to fetch");
                    }
                } catch (e) {
                    console.warn("Backend not ready, using mock data", e);
                    // Fallback Mock Data
                    setStats({
                        total_records: 120,
                        district_stats: [
                            { District: 'Pudukkottai', Crop: 'Rice', Yield_ton_per_ha: 4.2 },
                            { District: 'Pudukkottai', Crop: 'Maize', Yield_ton_per_ha: 3.8 },
                            { District: 'Thanjavur', Crop: 'Rice', Yield_ton_per_ha: 5.1 },
                            { District: 'Thanjavur', Crop: 'Maize', Yield_ton_per_ha: 4.0 },
                            { District: 'Madurai', Crop: 'Rice', Yield_ton_per_ha: 3.9 },
                        ]
                    });
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load data");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-10 text-center animate-pulse">Loading Data...</div>;
    if (error && !stats) return <div className="p-10 text-center text-red-500">Failed to load data.</div>;

    // Process data for CSV Chart
    const districts = [...new Set(stats.district_stats.map(s => s.District))];
    const riceData = districts.map(d => {
        const item = stats.district_stats.find(s => s.District === d && s.Crop === 'Rice');
        return item ? item.Yield_ton_per_ha : 0;
    });

    // Find max value for scaling
    const maxVal = Math.max(...riceData, 6); // default min max 6

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4 text-green-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t.officerTitle || "Regional Agricultural Overview"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500">{t.totalData || "Total Data Points"}</p>
                        <p className="text-2xl font-bold">{stats.total_records}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded border-l-4 border-green-500">
                        <p className="text-sm text-gray-500">{t.districtsMonitored || "Districts Monitored"}</p>
                        <p className="text-2xl font-bold">{districts.length}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-500">
                        <p className="text-sm text-gray-500">{t.cropsAnalyzed || "Crops Analyzed"}</p>
                        <p className="text-2xl font-bold">2 (Rice, Maize)</p>
                    </div>
                </div>

                {/* CSS Bar Chart */}
                <div className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-600 mb-4 text-center">{t.riceYield || "Rice Yield by District (Tons/Ha)"}</h3>
                    <div className="h-64 w-full flex items-end justify-around gap-2 border-b border-gray-200 pb-2">
                        {districts.map((d, i) => {
                            const val = riceData[i];
                            const height = (val / maxVal) * 100;
                            return (
                                <div key={d} className="flex flex-col items-center justify-end h-full w-full group">
                                    <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-green-700">{val}</div>
                                    <div
                                        className="w-12 bg-green-500 rounded-t hover:bg-green-600 transition-all"
                                        style={{ height: `${height}%` }}
                                    ></div>
                                    <div className="mt-2 text-xs text-gray-500 font-medium rotate-0 md:rotate-0">{d}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    {t.alertsTitle || "Alerts & Risks"}
                </h3>
                {/* Placeholder for alerts */}
                <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200">
                    ⚠️ <b>Drought Risk:</b> Pudukkottai rainfall below average in recent simulations.
                </div>
            </div>
        </div>
    );
};

export default OfficerDashboard;

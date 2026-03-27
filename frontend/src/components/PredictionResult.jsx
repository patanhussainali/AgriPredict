/* eslint-disable react/prop-types */
import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext.jsx';
import {
    Sprout,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Leaf,
    Info
} from 'lucide-react';

const PredictionResult = ({ result }) => {
    const { lang } = useContext(LanguageContext);

    const translations = {
        en: {
            yield: "Predicted Yield",
            avg: "Historical Average",
            confidence: "Confidence Score",
            advisory: "Farm Advisory",
            risk: "Risk Assessment",
            unit: "tons/ha",
            highRisk: "High Risk",
            safe: "Low Risk"
        },
        ta: {
            yield: "கணிக்கப்பட்ட விளைச்சல்",
            avg: "வரலாற்று சராசரி",
            confidence: "நம்பிக்கை",
            advisory: "பயிர் ஆலோசனை",
            risk: "ஆபத்து மதிப்பீடு",
            unit: "டன்/ஹெக்டேர்",
            highRisk: "அதிக ஆபத்து",
            safe: "குறைந்த ஆபத்து"
        }
    };

    const t = translations[lang];

    // Determine styles based on risk (Safe Defaults)
    const isHighRisk = (result?.risk_color || 'green') === 'red';
    const riskColorClass = isHighRisk ? 'text-red-700' : 'text-green-700';
    const riskBgClass = isHighRisk ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
    const RiskIcon = isHighRisk ? AlertTriangle : CheckCircle;

    return (
        <div className="animate-fade-in space-y-6">
            {/* Header / Risk Banner */}
            <div className={`flex items-center gap-3 p-4 rounded-lg border-l-4 shadow-sm ${riskBgClass}`}>
                <RiskIcon className={`w-8 h-8 ${riskColorClass}`} />
                <div>
                    <h3 className={`font-bold text-lg ${riskColorClass}`}>
                        {result?.risk_level || (isHighRisk ? "High Risk" : "Normal")}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {isHighRisk
                            ? "Action recommended to secure yield."
                            : "Conditions are favorable for cultivation."}
                    </p>
                </div>
            </div>

            {/* Main Yield Metric */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                <Sprout className="w-12 h-12 text-blue-500 mb-2 opacity-80" />
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t.yield}</span>
                <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-extrabold text-gray-900">{result?.predicted_yield || result?.prediction || "0"}</span>
                    <span className="text-xl font-medium text-gray-500">{result?.unit || t.unit}</span>
                </div>
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <TrendingUp className="w-6 h-6 text-purple-500 mb-2" />
                    <span className="text-xs text-gray-500 font-medium uppercase">{t.avg}</span>
                    <span className="text-lg font-bold text-gray-800">{result?.historical_average || "---"} <span className="text-xs font-normal text-gray-400">{result?.unit || t.unit}</span></span>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                    <Info className="w-6 h-6 text-teal-500 mb-2" />
                    <span className="text-xs text-gray-500 font-medium uppercase">{t.confidence}</span>
                    <span className="text-lg font-bold text-gray-800">{result?.confidence_score || result?.confidence || "90"}%</span>
                </div>
            </div>

            {/* AI Analysis Section */}
            {result.ai_analysis && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 shadow-sm overflow-hidden">
                    <div className="bg-indigo-100/50 px-4 py-3 border-b border-indigo-200 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                        <h4 className="font-semibold text-indigo-900">AI Recommendation</h4>
                    </div>
                    <div className="p-5 text-gray-800 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {result.ai_analysis}
                    </div>
                </div>
            )}

            {/* Advisory Section */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Leaf className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-gray-800">{t.advisory}</h4>
                </div>
                <div className="p-4">
                    {(result?.advisory_list && result.advisory_list.length > 0) ? (
                        <ul className="space-y-3">
                            {result.advisory_list.map((item, idx) => (
                                <li key={idx} className="flex cross-start gap-3 text-sm text-gray-700">
                                    <div className="mt-0.5 min-w-[20px] h-5 flex items-center justify-center bg-blue-100 rounded-full">
                                        <span className="text-blue-600 text-xs font-bold">{idx + 1}</span>
                                    </div>
                                    <span className="leading-snug">{item}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No specific advisories at this time.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictionResult;

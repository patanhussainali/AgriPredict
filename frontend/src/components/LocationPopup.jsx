import React, { useContext } from 'react';
import { MapPin } from 'lucide-react';
import { LanguageContext } from '../context/LanguageContext';

const LocationPopup = ({ onAllow, onDeny }) => {
    const { t } = useContext(LanguageContext);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex flex-col justify-end sm:justify-center items-center p-4">
            <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6 transform transition-all relative animate-in fade-in slide-in-from-bottom-5 duration-200">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-100 p-4 rounded-full">
                        <MapPin className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                    {t?.locationRequired || "Location Access Required"}
                </h3>
                <p className="text-center text-gray-600 mb-6 text-sm">
                    {t?.locationMessage || "We need your location to show local weather and personalized crop recommendations for your area."}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onAllow}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-xl transition-colors shadow-md flex justify-center items-center"
                    >
                        {t?.allowAccess || "Allow Access"}
                    </button>
                    <button
                        onClick={onDeny}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-colors"
                    >
                        {t?.notNow || "Not Now"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LocationPopup;

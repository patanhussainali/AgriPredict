import { useContext, useState, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext.jsx';
import { Moon, Sun, Type, Globe, Shield } from 'lucide-react';

const SettingsPage = () => {
    const { t, lang, setLang, fontSize, setFontSize } = useContext(LanguageContext);
    const [highContrast, setHighContrast] = useState(false);

    // Local state for slider to allow preview before applying
    const [tempFontSize, setTempFontSize] = useState(fontSize);

    // Sync local state if global state changes externally
    useEffect(() => {
        setTempFontSize(fontSize);
    }, [fontSize]);

    const handleApplyFontSize = () => {
        setFontSize(tempFontSize);
    };

    const languages = [
        { code: 'en', label: 'English (United States)' },
        { code: 'ta', label: 'Tamil (தமிழ்)' },
        { code: 'te', label: 'Telugu (తెలుగు)' },
        { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
        { code: 'hi', label: 'Hindi (हिंदी)' },
        { code: 'ur', label: 'Urdu (اردو)' },
    ];

    // Calculate preview font size in pixels (assuming base 16px)
    // 75% to 125% of 16px
    const previewPixels = Math.round(16 * ((75 + (tempFontSize / 100) * 50) / 100));

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in-up">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{t.settings}</h1>
                <p className="text-gray-500 mt-1">{t.managePreferences}</p>
            </div>

            <div className="space-y-6">

                {/* App Language Session */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-4">
                            <h2 className="text-lg font-bold text-gray-900">{t.appLanguage}</h2>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">{t.chooseLanguage}</p>

                        <div className="relative">
                            <select
                                value={lang}
                                onChange={(e) => setLang(e.target.value)}
                                className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-3 pr-10"
                            >
                                {languages.map((l) => (
                                    <option key={l.code} value={l.code}>
                                        {l.label}
                                    </option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accessibility Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-1">{t.accessibility}</h2>
                        <p className="text-sm text-gray-500 mb-6">Adjust the appearance of the app to your needs.</p>

                        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 text-sm">{t.highContrast}</h3>
                                <p className="text-xs text-gray-500 mt-1">{t.highContrastDesc}</p>
                            </div>
                            <button
                                onClick={() => setHighContrast(!highContrast)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${highContrast ? 'bg-green-600' : 'bg-gray-200'}`}
                            >
                                <span
                                    className={`${highContrast ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                />
                            </button>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 text-sm mb-4">{t.fontSize}</h3>
                            <p className="text-xs text-gray-500 mb-4">{t.fontSizeDesc}</p>

                            {/* Preview Box */}
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Preview Text</p>
                                <p className="text-gray-800 leading-relaxed" style={{ fontSize: `${previewPixels}px` }}>
                                    This is how your text will look. <br />
                                    Adjust the slider below to change size.
                                </p>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-xs text-gray-500 font-medium">A</span>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={tempFontSize}
                                    onChange={(e) => setTempFontSize(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                                />
                                <span className="text-lg text-gray-900 font-medium">A</span>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={handleApplyFontSize}
                                    disabled={tempFontSize === fontSize}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tempFontSize === fontSize
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                                        }`}
                                >
                                    Apply Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>



            </div>

            {/* Change Password Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-1">Change Password</h2>
                    <p className="text-sm text-gray-500 mb-6">Receive a link to reset your password via email.</p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="your@email.com"
                                    className="flex-1 block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                    id="reset-email-input"
                                />
                                <button
                                    onClick={async () => {
                                        const emailInput = document.getElementById('reset-email-input');
                                        const email = emailInput.value;
                                        if (!email) {
                                            alert("Please enter your email.");
                                            return;
                                        }

                                        const btn = document.getElementById('reset-btn');
                                        const originalText = btn.innerText;
                                        btn.innerText = "Sending...";
                                        btn.disabled = true;

                                        try {
                                            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email }),
                                            });

                                            if (response.ok) {
                                                alert("Password reset link sent to " + email);
                                                emailInput.value = "";
                                            } else {
                                                alert("Failed to send link. Please try again.");
                                            }
                                        } catch (e) {
                                            console.error(e);
                                            alert("Error sending request.");
                                        } finally {
                                            btn.innerText = originalText;
                                            btn.disabled = false;
                                        }
                                    }}
                                    id="reset-btn"
                                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
                                >
                                    Send Link
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SettingsPage;

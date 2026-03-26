import React from 'react';
import { Mail, Shovel, Sprout, Tractor, CloudSun } from 'lucide-react';
import { CropPredictionIcon, YieldEstimationIcon, WeatherAdvisoryIcon } from './CustomIcons';

const LandingPage = ({ onLoginClick }) => {

    // Scroll to top on mount and clear hash to ensure Home section is visible
    React.useLayoutEffect(() => {
        // 1. Prevent browser from restoring scroll position
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // 2. Clear URL hash (e.g., #about) without reloading the page
        if (window.location.hash) {
            window.history.replaceState(null, null, window.location.pathname);
        }

        // 3. Temporarily disable smooth scroll for instant jump
        const html = document.documentElement;
        const body = document.body;

        const originalHtmlScroll = html.style.scrollBehavior;
        const originalBodyScroll = body.style.scrollBehavior;

        html.style.scrollBehavior = 'auto';
        body.style.scrollBehavior = 'auto';

        // 4. Force scroll to top instantly
        window.scrollTo(0, 0);

        // 5. Re-enable smooth scroll after a short delay
        const timer = setTimeout(() => {
            html.style.scrollBehavior = 'smooth';
            body.style.scrollBehavior = originalBodyScroll;
        }, 50);

        return () => {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'auto';
            }
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="min-h-screen flex flex-col font-sans relative">
            <header className="flex items-center justify-between px-8 py-4 bg-white shadow-sm sticky top-0 z-50 h-20">
                <div className="flex items-center gap-3 h-full">
                    <img src="/logo.png" alt="AgriPredict Logo" className="h-16 w-auto object-contain" />
                    <span className="text-2xl font-extrabold text-[#2D4A27] tracking-tighter">AgriPredict</span>
                </div>

                {/* Navigation */}
                <nav className="flex items-center flex-wrap justify-end gap-2 sm:gap-6 text-[10px] sm:text-sm font-semibold text-gray-600 ml-auto max-w-full">
                    <a href="#home" className="hover:text-green-700 transition-colors px-1 py-1 sm:px-0 sm:py-0">Home</a>
                    <a href="#about" className="hover:text-green-700 transition-colors px-1 py-1 sm:px-0 sm:py-0 whitespace-nowrap">About Us</a>
                    <a href="#services" className="hover:text-green-700 transition-colors px-1 py-1 sm:px-0 sm:py-0">Services</a>
                    <a href="#contact" className="hover:text-green-700 transition-colors px-1 py-1 sm:px-0 sm:py-0">Contact</a>
                </nav>
            </header>

            {/* Main Content - HERO (HOME) */}
            <section id="home" className="flex-1 flex flex-col md:flex-row bg-[#F3F8F2] min-h-screen pt-16 md:pt-0 relative"> {/* Added min-h-screen and padding for scroll offset */}

                {/* Left Side (Image) - Mobile: Top, Desktop: Left */}
                <div className="w-full md:w-5/12 h-64 md:h-auto relative overflow-hidden order-1 md:order-1 flex items-center justify-center bg-gray-200">
                    <img
                        src="/assets/farmer_hero.png"
                        alt="Farmer in greenhouse"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Right Side (Content) - Mobile: Bottom, Desktop: Right */}
                <div className="w-full md:w-7/12 bg-[#2D4A27] text-white p-8 md:p-16 flex flex-col justify-center order-2 md:order-2 relative">
                    <div className="max-w-xl">
                        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-2 tracking-tighter">
                            AgriPredict
                        </h1>
                        <h2 className="text-3xl md:text-5xl font-light text-[#8BC34A] mb-8">
                            Crop & Yield Prediction
                        </h2>

                        <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-10 max-w-lg">
                            Empowering farmers with AI-driven insights for better yields.
                            Join our community to access real-time crop predictions, weather updates,
                            and expert advisory services designed to make agriculture sustainable and profitable.
                        </p>

                        <div className="flex gap-4">
                            <a href="#about" className="bg-white text-[#2D4A27] px-8 py-3 rounded-sm font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center">
                                Learn More
                            </a>
                            <button
                                onClick={onLoginClick}
                                className="bg-[#558B2F] text-white px-8 py-3 rounded-sm font-semibold hover:bg-[#487528] transition-colors"
                            >
                                Log In
                            </button>
                        </div>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="hidden md:block absolute bottom-8 left-16 animate-bounce cursor-pointer">
                        <a href="#about" className="text-[#8BC34A] flex flex-col items-center opacity-80 hover:opacity-100">
                            <span className="text-xs mb-1 tracking-widest uppercase">Scroll</span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        </a>
                    </div>
                </div>
            </section>

            {/* Icons Footer Strip - Directly imitates layout */}
            <div className="bg-white h-auto md:h-32 flex flex-wrap">
                {/* Dark Green Box with Cart/Wheelbarrow Icon */}
                <div className="w-1/2 md:w-1/4 bg-[#21381D] flex items-center justify-center p-8 md:p-0">
                    <Tractor className="text-[#8BC34A] w-16 h-16 opacity-80" strokeWidth={1} />
                </div>

                {/* Light Green/White Box with Shovel */}
                <div className="w-1/2 md:w-1/4 bg-[#8BC34A] flex items-center justify-center p-8 md:p-0">
                    <Shovel className="text-[#21381D] w-16 h-16 opacity-80" strokeWidth={1} />
                </div>

                {/* Dark Green Box with Rake/Fork */}
                <div className="w-1/2 md:w-1/4 bg-[#46663F] flex items-center justify-center p-8 md:p-0">
                    <Sprout className="text-white w-16 h-16 opacity-80" strokeWidth={1} />
                </div>

                {/* White Box Icons */}
                <div className="w-1/2 md:w-1/4 bg-white flex items-center justify-around p-4 text-[#558B2F]">
                    <div className="flex flex-col items-center gap-2">
                        <WeatherAdvisoryIcon className="w-10 h-10" />
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <CropPredictionIcon className="w-10 h-10" />
                    </div>
                </div>

            </div>

            {/* ABOUT US SECTION */}
            <section id="about" className="py-20 px-8 bg-white text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold text-[#2D4A27] mb-6">About Us</h2>
                    <p className="text-gray-600 leading-relaxed text-lg">
                        At AgriPredict, we believe in the power of data to transform agriculture.
                        Our mission is to bridge the gap between traditional farming practices and modern technology.
                        By leveraging advanced machine learning algorithms, we provide farmers with accurate crop
                        recommendations and yield predictions, helping them make informed decisions and optimize their harvest.
                    </p>
                </div>
            </section>

            {/* SERVICES SECTION */}
            <section id="services" className="py-20 px-8 bg-[#F3F8F2]">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-[#2D4A27] mb-12 text-center">Our Services</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Service 1 */}
                        <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
                            <div className="bg-[#E8F5E9] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#C8E6C9]">
                                <CropPredictionIcon className="w-10 h-10 text-[#2E7D32]" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Crop Prediction</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Analyze soil and climate data to recommend the most suitable crops for your land.
                            </p>
                        </div>
                        {/* Service 2 */}
                        <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
                            <div className="bg-[#E8F5E9] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#C8E6C9]">
                                <YieldEstimationIcon className="w-10 h-10 text-[#2E7D32]" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Yield Estimation</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Get accurate yield forecasts to plan your harvest and market strategies effectively.
                            </p>
                        </div>
                        {/* Service 3 */}
                        <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 text-center border border-gray-100">
                            <div className="bg-[#E8F5E9] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8 border border-[#C8E6C9]">
                                <WeatherAdvisoryIcon className="w-10 h-10 text-[#2E7D32]" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">Weather Advisory</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Real-time weather updates and alerts to protect your crops from adverse conditions.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CONTACT SECTION */}
            <section id="contact" className="py-20 px-8 bg-[#2D4A27] text-white text-center">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
                    <p className="text-gray-300 mb-8">
                        Have questions or need support? Reach out to our team of agricultural experts.
                    </p>
                    <div className="flex flex-col md:flex-row justify-center gap-8 text-left inline-block">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#487528] p-3 rounded-full">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-semibold">Email Us</h4>
                                <p className="text-sm text-gray-300">agripredictcustomercare@gmail.com</p>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <footer className="bg-[#21381D] text-gray-400 py-6 text-center text-sm">
                &copy; 2026 AgriPredict. All rights reserved.
            </footer>
        </div>
    );
};

export default LandingPage;

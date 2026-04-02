import { useContext, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext.jsx';
import {
    LayoutDashboard,
    Sprout,
    CloudSun,
    MessageSquare,
    BarChart3,
    Settings,
    User,
    HelpCircle,
    LogOut,
    Leaf
} from 'lucide-react';

const Sidebar = ({ activeTab, onTabChange, onLogout, isMobileOpen, isDesktopOpen, onCloseMobile }) => {
    const { t } = useContext(LanguageContext);

    // Lock body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileOpen]);

    const menuItems = [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'prediction', label: t.prediction, icon: Sprout },
        { id: 'weather', label: t.weather, icon: CloudSun },
        { id: 'chat', label: t.chat, icon: MessageSquare },
        { id: 'analytics', label: t.analytics, icon: BarChart3 },
    ];

    const bottomItems = [
        { id: 'account', label: t.account, icon: User },
        { id: 'help', label: t.help, icon: HelpCircle },
        { id: 'settings', label: t.settings, icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed top-16 inset-x-0 bottom-0 bg-black/50 z-[60] md:hidden"
                    onClick={onCloseMobile}
                ></div>
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed top-16 left-0 z-[70] h-[calc(100dvh-4rem)] w-72 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col
                md:top-0 md:h-screen md:w-64
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isDesktopOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}
            `}>
                {/* Logo Area — desktop only, hidden on mobile since header is visible */}
                <div className="hidden md:flex h-16 items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="AgriPredict Logo" className="h-8 w-8 object-contain" />
                        <span className="text-green-600 font-bold text-xl tracking-tight">AgriPredict AI</span>
                    </div>
                </div>

                {/* Mobile header inside sidebar */}
                <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-gray-100 bg-green-50">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" alt="AgriPredict Logo" className="h-8 w-8 object-contain" />
                    <span className="text-green-700 font-bold text-base">AgriPredict AI</span>
                    <button onClick={onCloseMobile} className="text-gray-500 hover:text-gray-700 p-1">✕</button>
                </div>

                {/* Main Menu */}
                <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5 min-h-0">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    onCloseMobile();
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Menu — always visible, never scrolled away */}
                <div className="shrink-0 p-3 border-t border-gray-100 space-y-0.5 bg-white">
                    {bottomItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    onCloseMobile();
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs md:text-sm font-medium transition-colors
                                    ${activeTab === item.id
                                        ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <Icon className={`w-5 h-5 shrink-0 ${activeTab === item.id ? 'text-green-600' : 'text-gray-400'}`} />
                                {item.label}
                            </button>
                        );
                    })}

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors mt-2 shadow-sm"
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {t.logout}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

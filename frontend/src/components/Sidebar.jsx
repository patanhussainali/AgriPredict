import { useContext } from 'react';
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

// eslint-disable-next-line react/prop-types
const Sidebar = ({ activeTab, onTabChange, onLogout, isMobileOpen, isDesktopOpen, onCloseMobile }) => {
    const { t } = useContext(LanguageContext);

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
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onCloseMobile}
                ></div>
            )}

            {/* Sidebar Container */}
            <aside className={`
                fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out flex flex-col
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
                ${isDesktopOpen ? 'md:translate-x-0' : 'md:-translate-x-full'}
            `}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-green-600 font-bold text-xl">
                        <Leaf className="fill-green-600 w-6 h-6" />
                        <span>AgriPredict AI</span>
                    </div>
                </div>

                {/* Main Menu */}
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
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
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${isActive
                                        ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>

                {/* Bottom Menu */}
                <div className="p-3 border-t border-gray-100 space-y-1">
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
                                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                                    ${activeTab === item.id
                                        ? 'bg-green-50 text-green-700 border-l-4 border-green-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}
                            >
                                <Icon className={`w-5 h-5 ${activeTab === item.id ? 'text-green-600' : 'text-gray-400'}`} />
                                {item.label}
                            </button>
                        );
                    })}

                    <button
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
                    >
                        <LogOut className="w-5 h-5" />
                        {t.logout}
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

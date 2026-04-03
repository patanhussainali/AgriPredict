import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext.jsx';
import {
    LayoutDashboard,
    Sprout,
    CloudSun,
    MessageSquare,
    Microscope
} from 'lucide-react';

const BottomNav = ({ activeTab, onTabChange }) => {
    const { t } = useContext(LanguageContext);

    const navItems = [
        { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
        { id: 'prediction', label: t.prediction, icon: Sprout },
        { id: 'disease', label: t.disease || 'Disease', icon: Microscope },
        { id: 'weather', label: t.weather, icon: CloudSun },
        { id: 'chat', label: t.chat, icon: MessageSquare },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 md:hidden z-50 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`flex flex-col items-center gap-1 transition-colors relative px-2 ${isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {/* Active Indicator Line */}
                        {isActive && (
                            <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-emerald-600 rounded-b-lg"></span>
                        )}

                        <Icon strokeWidth={isActive ? 2.5 : 2} className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : ''}`} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNav;

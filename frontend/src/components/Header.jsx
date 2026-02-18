import { PanelLeft } from 'lucide-react';

// eslint-disable-next-line react/prop-types
const Header = ({ user, onMenuClick, onProfileClick }) => {
    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
            {/* Left: Mobile Menu Trigger & Search */}
            <div className="flex items-center gap-4 flex-1">
                <button
                    onClick={onMenuClick}
                    className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-600 block"
                >
                    <PanelLeft className="w-6 h-6" />
                </button>


            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-4">


                <div
                    className="flex items-center gap-3 pl-2 border-l border-gray-200 cursor-pointer"
                    onClick={onProfileClick}
                >
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                        {/* eslint-disable-next-line react/prop-types */}
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;


import { useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { Shield, Mail, Calendar, Clock, Globe } from 'lucide-react';

// eslint-disable-next-line react/prop-types
const AccountPage = ({ user }) => {
    const { t } = useContext(LanguageContext);

    // Display data from the real user object
    const userData = {
        name: user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.name || 'User'),
        role: user?.role || 'farmer',
        userId: user?.uid || 'N/A',
        email: user?.email || 'No email provided',
        emailVerified: !!user?.emailVerified,
        accountCreated: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
        lastSignIn: new Date().toLocaleString(),
        provider: user?.authProvider ? (user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1)) : 'Email'
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">{t.account}</h1>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Profile Header */}
                <div className="flex flex-col items-center pt-8 pb-6">
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-4xl mb-4 border-4 border-white shadow-sm">
                        {/* Use first letter of name or default icon */}
                        {userData.name.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{userData.name}</h2>
                    <p className="text-gray-500 text-sm mt-1">{userData.email}</p>
                </div>

                <hr className="border-gray-100" />

                {/* Account Details List */}
                <div className="p-6 space-y-4">

                    {/* User ID */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                        <span className="text-gray-500 font-medium mb-1 sm:mb-0">{t.userID || "User ID"}</span>
                        <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-xs font-mono break-all sm:max-w-xs">
                            {userData.userId}
                        </div>
                    </div>
                    <hr className="border-gray-50" />

                    {/* Email Verified */}
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500 font-medium">{t.emailVerified || "Email Verified"}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${userData.emailVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {userData.emailVerified ? (t.yes || "Yes") : (t.no || "No")}
                        </span>
                    </div>
                    <hr className="border-gray-50" />

                    {/* Account Created */}
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500 font-medium">{t.accountCreated || "Account Created"}</span>
                        <span className="text-gray-900 font-medium text-sm">{userData.accountCreated}</span>
                    </div>
                    <hr className="border-gray-50" />

                    {/* Last Sign-in */}
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500 font-medium">{t.lastSignIn || "Last Sign-in"}</span>
                        <span className="text-gray-900 font-medium text-sm text-right">{userData.lastSignIn}</span>
                    </div>
                    <hr className="border-gray-50" />

                    {/* Provider */}
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-500 font-medium">{t.provider || "Provider"}</span>
                        <span className="text-gray-900 font-medium text-sm">{userData.provider}</span>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AccountPage;

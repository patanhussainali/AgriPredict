import { useState, useContext, useEffect } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { Shield, Mail, Calendar, Clock, Globe, Edit2, Save, X, Check, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

// eslint-disable-next-line react/prop-types
const AccountPage = ({ user, onUpdateUser }) => {
    const { t } = useContext(LanguageContext);
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form States
    const [firstName, setFirstName] = useState(user?.first_name || user?.name?.split(' ')[0] || '');
    const [lastName, setLastName] = useState(user?.last_name || user?.name?.split(' ').slice(1).join(' ') || '');
    const [handle, setHandle] = useState(user?.handle || '');
    const [originalHandle, setOriginalHandle] = useState(user?.handle || '');

    const [handleError, setHandleError] = useState(null);
    const [handleSuccess, setHandleSuccess] = useState(false);

    // Display data from the real user object
    const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : (user?.name || 'User');
    const displayHandle = user?.handle ? `@${user.handle}` : 'Not set';

    const userData = {
        name: displayName,
        handle: displayHandle,
        role: user?.role || 'farmer',
        firebaseUid: user?.uid || 'N/A',
        email: user?.email || 'No email provided',
        emailVerified: !!user?.emailVerified,
        accountCreated: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
        lastSignIn: new Date().toLocaleString(),
        provider: user?.authProvider ? (user.authProvider.charAt(0).toUpperCase() + user.authProvider.slice(1)) : 'Email'
    };

    // Real-time Handle Check
    useEffect(() => {
        if (!isEditing) return;

        const checkHandle = async () => {
            const cleanHandle = handle.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
            if (cleanHandle !== handle && handle.length > 0) {
                setHandleError("Only lowercase letters, numbers, and underscores allowed.");
                setHandleSuccess(false);
                return;
            }
            if (!cleanHandle) {
                setHandleError(null);
                setHandleSuccess(false);
                return;
            }
            if (cleanHandle === originalHandle) {
                setHandleError(null);
                setHandleSuccess(true);
                return;
            }
            if (cleanHandle.length < 3) {
                setHandleError("Handle must be at least 3 characters.");
                setHandleSuccess(false);
                return;
            }

            try {
                const docRef = doc(db, "usernames", cleanHandle);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setHandleError(`Handle @${cleanHandle} is already taken.`);
                    setHandleSuccess(false);
                } else {
                    setHandleError(null);
                    setHandleSuccess(true);
                }
            } catch (err) {
                console.error("Error checking handle:", err);
            }
        };

        const timeoutId = setTimeout(checkHandle, 500); // debounce 500ms
        return () => clearTimeout(timeoutId);
    }, [handle, isEditing, originalHandle]);

    const handleSave = async () => {
        if (handleError) return;

        setLoading(true);
        try {
            const cleanHandle = handle.trim().toLowerCase();

            // 1. If Handle changed, update standard "usernames" Collection to reserve it
            if (cleanHandle !== originalHandle) {
                // Reserve the new one
                if (cleanHandle) {
                    await setDoc(doc(db, "usernames", cleanHandle), {
                        uid: user.uid,
                        createdAt: new Date().toISOString()
                    });
                }
                // Delete the old one if it existed
                if (originalHandle) {
                    await deleteDoc(doc(db, "usernames", originalHandle));
                }
            }

            // 2. Update user document
            const updatedProfile = {
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                name: `${firstName.trim()} ${lastName.trim()}`.trim(),
                handle: cleanHandle
            };

            await updateDoc(doc(db, "users", user.uid), updatedProfile);

            // Update Local State App.jsx to reflect immediately
            const newUserObj = { ...user, ...updatedProfile };
            localStorage.setItem('user', JSON.stringify(newUserObj));
            if (onUpdateUser) onUpdateUser(newUserObj);

            setOriginalHandle(cleanHandle);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to save profile:", err);
            setHandleError("Failed to save profile. Try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto py-10 px-4 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">{t.account || "Account Settings"}</h1>

            <div className="bg-transparent overflow-hidden">
                {/* Profile Header */}
                <div className="flex flex-col items-center pt-8 pb-6 relative">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors text-sm font-semibold"
                        >
                            <Edit2 className="w-4 h-4" /> Edit Profile
                        </button>
                    )}

                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-4xl mb-4 shadow-sm border border-green-200">
                        {/* Use first letter of name or default icon */}
                        {userData.name.charAt(0).toUpperCase()}
                    </div>
                </div>

                <hr className="border-gray-200" />

                {/* Account Details List */}
                <div className="p-0 sm:p-4 space-y-4 mt-4">

                    {isEditing ? (
                        <div className="bg-transparent mb-6 space-y-4">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit Profile</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 font-medium">@</span>
                                    <input
                                        type="text"
                                        value={handle}
                                        onChange={e => setHandle(e.target.value)}
                                        placeholder="your_unique_username"
                                        className={`w-full pl-8 pr-10 py-3 bg-gray-50 border ${handleError ? 'border-red-500 focus:ring-red-500' : (handleSuccess && handle ? 'border-green-500 focus:ring-green-500' : 'border-gray-200 focus:ring-green-500')} rounded-full focus:bg-white focus:ring-2 focus:outline-none`}
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                                        {handleError && <AlertCircle className="w-5 h-5 text-red-500" />}
                                        {handleSuccess && handle && <Check className="w-5 h-5 text-green-500" />}
                                    </div>
                                </div>
                                {handleError && <p className="text-red-500 text-xs mt-1 ml-2">{handleError}</p>}
                                {handleSuccess && handle && <p className="text-green-600 text-xs mt-1 ml-2">Username is available!</p>}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setHandle(originalHandle);
                                        setHandleError(null);
                                    }}
                                    className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading || !!handleError}
                                    className="flex-1 py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-full font-bold transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Profile'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-transparent mb-4 space-y-4">
                            {/* Profile Info Display */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gray-100 pb-4">
                                <span className="text-gray-500 font-medium mb-1 sm:mb-0">Full Name</span>
                                <span className="text-gray-900 font-bold">{userData.name}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 pb-2">
                                <span className="text-gray-500 font-medium mb-1 sm:mb-0">Username</span>
                                <span className="text-green-700 font-bold bg-green-50 px-3 py-1 rounded-full">{userData.handle}</span>
                            </div>
                        </div>
                    )}

                    <div className="bg-transparent space-y-4 mt-8 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2 border-b border-gray-100 pb-3">System Information</h3>

                        {/* Firebase UID */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2">
                            <span className="text-gray-500 font-medium mb-1 sm:mb-0">{t.userID || "Firebase Auth ID"}</span>
                            <div className="bg-gray-100 text-gray-700 px-3 py-1 text-xs font-mono break-all sm:max-w-xs rounded-lg">
                                {userData.firebaseUid}
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
        </div>
    );
};

export default AccountPage;

import API_URL from '../config';

/* eslint-disable react/prop-types */
import { useState, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext.jsx';
import { Leaf, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
        />
        <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
        />
        <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
            fill="#FBBC05"
        />
        <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
        />
    </svg>
);

const Login = ({ onLogin, onBack }) => {
    // eslint-disable-next-line no-unused-vars
    const { lang } = useContext(LanguageContext); // Kept for future use or compatibility
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotMessage, setForgotMessage] = useState(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    const handleSignupSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/signup`, { // Use API_URL here too, not localhost!
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password
                }),
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                if (text.trim().startsWith("<")) {
                    throw new Error(`Configuration Error: Received HTML from "${API_URL}/signup". Check VITE_API_URL.`);
                }
                throw new Error(`Server Error (${response.status}): ${text.slice(0, 100)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Signup failed');
            }

            // Move to login view or show success
            setIsSignUp(false);
            setLoginEmail(email); // Pre-fill email
            setLoginPassword('');
            // Show verification message
            setError(null);
            alert("Account created! Please verify your email before logging in.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: loginEmail,
                    password: loginPassword
                }),
            });

            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                // Check if it's HTML (likely 404 SPA fallback)
                if (text.trim().startsWith("<")) {
                    throw new Error(`Configuration Error: The app is trying to connect to "${API_URL}/login" but received a Web Page (HTML) instead of Data (JSON). Please check your VITE_API_URL setting in Vercel. It should end with "/api".`);
                }
                throw new Error(`Server Error (${response.status}): ${text.slice(0, 100)}`);
            }

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error("Email not verified. Please check your inbox for the verification link.");
                }
                throw new Error(data.detail || 'Login failed');
            }

            // Login successful
            const userProfile = {
                ...data.user,
                name: `${data.user.first_name} ${data.user.last_name}`,
                rollNo: '000', // Mock data
                role: data.user.role || 'farmer'
            };
            onLogin(userProfile);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPasswordSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setForgotMessage(null);
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: forgotEmail }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Failed to send reset link');
            }

            setForgotMessage("If an account exists with this email, a password reset link has been sent.");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
            {/* Back to Home Button - Absolute to screen or relative to card? Let's put it on the card for better UX */}
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 animate-fade-in-up relative">
                <button
                    onClick={() => {
                        if (isForgotPassword) {
                            setIsForgotPassword(false);
                            setError(null);
                            setForgotMessage(null);
                        } else {
                            onBack();
                        }
                    }}
                    className="absolute top-4 left-4 p-2 text-gray-400 hover:text-green-600 transition-colors"
                    title={isForgotPassword ? "Back to Login" : "Back to Home"}
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>

                {isForgotPassword ? (
                    // FORGOT PASSWORD VIEW
                    <div className="space-y-6 mt-6">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
                            <p className="text-gray-500 mt-1">Enter your email to receive a reset link.</p>
                        </div>

                        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={forgotEmail}
                                    onChange={(e) => setForgotEmail(e.target.value)}
                                    className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                    placeholder="your@email.com"
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {forgotMessage && <p className="text-green-600 text-sm text-center bg-green-50 p-2 rounded-lg">{forgotMessage}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:opacity-70"
                            >
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <button
                                onClick={() => { setIsForgotPassword(false); setError(null); setForgotMessage(null); }}
                                className="text-gray-500 hover:text-gray-900 text-sm"
                            >
                                Back to Login
                            </button>
                        </div>
                    </div>
                ) : isSignUp ? (
                    // SIGNUP VIEW
                    <div className="space-y-6 mt-6"> {/* Added mt-6 to clear the back button */}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
                            <p className="text-gray-500 mt-1">Join us to start predicting crop yields.</p>
                        </div>

                        <form onSubmit={handleSignupSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                    placeholder="m@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Re-enter Password</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={`block w-full pl-3 pr-10 py-2 bg-gray-50 border ${password && confirmPassword && password !== confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-green-500'} rounded-lg focus:bg-white focus:ring-2 focus:outline-none transition-colors`}
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && isSignUp && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:opacity-70"
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <button
                                    onClick={() => { setIsSignUp(false); setError(null); }}
                                    className="text-green-600 font-bold hover:underline"
                                >
                                    Login
                                </button>
                            </p>
                        </div>
                    </div>
                ) : (
                    // WELCOME / LOGIN VIEW
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                            <Leaf className="w-8 h-8 text-green-600" />
                        </div>

                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                            <p className="text-gray-500 mt-2">Sign in to access your dashboard.</p>
                        </div>

                        <form onSubmit={handleLoginSubmit} className="w-full space-y-4 text-left">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className="block w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Password</label>
                                    <button
                                        type="button"
                                        onClick={() => { setIsForgotPassword(true); setError(null); }}
                                        className="text-xs text-green-600 hover:underline"
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type={showLoginPassword ? "text" : "password"}
                                        required
                                        value={loginPassword}
                                        onChange={(e) => setLoginPassword(e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:outline-none transition-colors"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && !isSignUp && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:opacity-70"
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="flex items-center w-full">
                            <div className="flex-1 border-t border-gray-200"></div>
                            <span className="px-3 text-gray-400 text-sm">OR</span>
                            <div className="flex-1 border-t border-gray-200"></div>
                        </div>

                        <div className="w-full space-y-3 flex justify-center">
                            <GoogleLogin
                                onSuccess={async (credentialResponse) => {
                                    try {
                                        setLoading(true);
                                        const res = await fetch(`${API_URL}/google-login`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ credential: credentialResponse.credential }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.detail || 'Google Login failed');

                                        const userProfile = {
                                            ...data.user,
                                            name: `${data.user.first_name} ${data.user.last_name}`,
                                            rollNo: '000',
                                            role: data.user.role || 'farmer'
                                        };
                                        onLogin(userProfile);
                                    } catch (err) {
                                        setError(err.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                onError={() => {
                                    setError('Google Login Failed');
                                }}
                                useOneTap
                                theme="outline"
                                size="large"
                                width="100%"
                            />
                        </div>

                        <p className="text-sm text-gray-600 mt-4">
                            Don&apos;t have an account?{' '}
                            <button
                                onClick={() => { setIsSignUp(true); setError(null); }}
                                className="text-green-600 font-bold hover:underline"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>
                )}
            </div>

            <p className="fixed bottom-4 text-center text-xs text-gray-400">
                &copy; 2026 AI Crop System
            </p>
        </div>
    );
};

export default Login;

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader, ArrowLeft } from 'lucide-react';

const VerifyEmail = () => {
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('Verifying your email...');

    useEffect(() => {
        const verify = async () => {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Invalid verification link. Token is missing.');
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await response.json();

                if (response.ok) {
                    setStatus('success');
                    setMessage('Email verified successfully! You can now login.');
                    // Redirect to home/login after 3 seconds
                    setTimeout(() => window.location.href = '/', 3000);
                } else {
                    setStatus('error');
                    setMessage(data.detail || 'Verification failed. Token may be invalid or expired.');
                }
            } catch (err) {
                setStatus('error');
                setMessage('Network error. Please try again later.');
            }
        };

        verify();
    }, []);

    const handleNavigateHome = () => {
        window.location.href = '/';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center animate-fade-in-up">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center">
                        <Loader className="w-16 h-16 text-green-600 animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email</h2>
                        <p className="text-gray-500">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verified!</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <p className="text-sm text-gray-400">Redirecting to login...</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                        >
                            Go to Login
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <XCircle className="w-16 h-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                        <p className="text-gray-500 mb-6">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to Login
                        </button>
                    </div>
                )}
            </div>

            <p className="fixed bottom-4 text-center text-xs text-gray-400">
                &copy; 2026 AI Crop System
            </p>
        </div>
    );
};

export default VerifyEmail;

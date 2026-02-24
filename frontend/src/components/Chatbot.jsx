import { useState, useRef, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { Send, Bot, Loader2, Mic, MicOff } from 'lucide-react';
import API_URL from '../config';

const Chatbot = () => {
    const { t, lang } = useContext(LanguageContext);
    // Standard chat state
    const [messages, setMessages] = useState([
        { text: t.agriAssistant + "! " + t.askSomething, sender: 'bot' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    // Update welcome message when language changes
    useEffect(() => {
        setMessages(prev => {
            // Only update if it's the initial welcome message from the bot
            if (prev.length === 1 && prev[0].sender === 'bot') {
                return [{ text: t.agriAssistant + "! " + t.askSomething, sender: 'bot' }];
            }
            return prev;
        });
    }, [lang, t]);

    const [isListening, setIsListening] = useState(false);
    const [isSupported, setIsSupported] = useState(true); // Default to true to prevent flash
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Initialize Speech Recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? ' ' : '') + transcript);
            };
            recognition.onerror = (event) => {
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current = recognition;
        } else {
            setIsSupported(false);
        }
    }, []);

    const toggleListening = () => {
        if (!isSupported || !recognitionRef.current) {
            alert("Voice input is not supported in this browser.\n\nPlease try using Google Chrome, Microsoft Edge, or Safari.");
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setInput('');
        setLoading(true);

        try {
            // Use GET request for Vercel stability
            const params = new URLSearchParams({
                message: userMsg,
                lang: lang
            });

            const res = await fetch(`${API_URL}/chat?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            const text = await res.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Non-JSON Response received:", text);
                throw new Error(`Invalid server response (not JSON). Received: ${text.substring(0, 50)}...`);
            }

            if (!res.ok) {
                // Display specific server error if available (e.g., "GROQ_API_KEY missing")
                throw new Error(data.error || data.detail || "Chat Service Unavailable");
            }

            setMessages(prev => [...prev, { text: data.response, sender: 'bot' }]);
        } catch (error) {
            console.error("Chat error:", error);
            const errorText = error.message.includes("Failed to fetch")
                ? (t.chatError || "Connection failed. Please check your internet.")
                : `Error: ${error.message}`;

            setMessages(prev => [...prev, { text: errorText, sender: 'bot' }]);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-green-600 p-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg">{t.agriAssistant}</h2>
                        <p className="text-green-100 text-xs">{t.poweredBy}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>

                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                }`}>
                                {msg.sender === 'user' ? 'U' : <Bot className="w-4 h-4" />}
                            </div>

                            {/* Bubble */}
                            <div className={`px-5 py-3.5 text-sm shadow-sm leading-relaxed ${msg.sender === 'user'
                                ? 'bg-green-600 text-white rounded-2xl rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-none'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center">
                                <Loader2 className="w-4 h-4 animate-spin text-green-600 mr-2" />
                                <span className="text-gray-400 text-xs">{t.thinking}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-3 rounded-xl transition-colors ${!isSupported
                            ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                            : isListening
                                ? 'bg-red-100 text-red-600 animate-pulse'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        title={isSupported ? t.voiceInput : t.voiceNotSupported}
                        disabled={!isSupported}
                    >
                        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t.askSomething}
                        className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:border-green-500 rounded-xl px-5 py-3 text-sm outline-none transition-all shadow-sm"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg font-medium flex items-center gap-2"
                    >
                        <span>{t.send}</span>
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;

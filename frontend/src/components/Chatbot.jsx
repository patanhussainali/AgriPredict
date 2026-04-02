import { useState, useRef, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { Send, Bot, Loader2, Mic, MicOff } from 'lucide-react';

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
            const groqKey = import.meta.env.VITE_GROQ_API_KEY;
            const systemPrompt = `You are an expert Agricultural Assistant. Answer in ${lang === 'ta' ? 'Tamil' : lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : lang === 'kn' ? 'Kannada' : lang === 'ur' ? 'Urdu' : 'English'} language. Keep answers concise, helpful, and focused on farming, crops, and weather.`;

            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqKey}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMsg }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error?.message || "Groq API Error");
            }

            const reply = data.choices[0].message.content;
            setMessages(prev => [...prev, { text: reply, sender: 'bot' }]);
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
        <div className="flex flex-col bg-white md:rounded-3xl md:shadow-sm md:border md:border-gray-100 overflow-hidden
            fixed inset-0 md:static md:inset-auto md:flex-1 md:min-h-0
            pb-[calc(env(safe-area-inset-bottom)+64px)] md:pb-0">
            {/* Header */}
            <div className="bg-green-600 p-5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
                        <Bot className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="font-bold text-lg leading-tight">{t.agriAssistant}</h2>
                        <p className="text-green-100 text-[10px] uppercase font-bold tracking-widest">{t.poweredBy}</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-gray-50/30">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[85%] sm:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3 animate-fade-in`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'user' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                {msg.sender === 'user' ? 'U' : <Bot className="w-4 h-4" />}
                            </div>
                            <div className={`px-5 py-3 text-sm shadow-sm leading-relaxed border ${msg.sender === 'user'
                                ? 'bg-green-600 border-green-700 text-white rounded-3xl rounded-tr-none'
                                : 'bg-white border-gray-100 text-gray-800 rounded-3xl rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-gray-100 px-5 py-3 rounded-3xl rounded-tl-none shadow-sm flex items-center">
                                <Loader2 className="w-4 h-4 animate-spin text-green-600 mr-2" />
                                <span className="text-gray-400 text-xs font-medium">{t.thinking}</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area — fixed above bottom nav on mobile */}
            <div className="shrink-0 p-4 bg-white border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
                <form onSubmit={handleSend} className="flex gap-2 sm:gap-4 max-w-4xl mx-auto">
                    <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-3.5 rounded-full transition-all ${!isSupported
                            ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                            : isListening
                                ? 'bg-red-50 text-red-600 animate-pulse ring-4 ring-red-50'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
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
                        className="flex-1 bg-gray-50 border border-gray-200 focus:bg-white focus:ring-4 focus:ring-green-50/50 focus:border-green-500 rounded-full px-6 py-3.5 text-sm outline-none transition-all shadow-inner"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="bg-green-600 text-white px-5 md:px-8 py-3.5 rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-bold flex items-center gap-2"
                    >
                        <span className="hidden sm:inline">{t.send}</span>
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chatbot;

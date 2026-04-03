import { useState, useRef, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext.jsx';
import {
    Upload, Camera, Leaf, AlertTriangle, CheckCircle,
    Loader2, X, FlaskConical, ShieldCheck, Sprout,
    TrendingUp, Info, Clock
} from 'lucide-react';

const CROP_OPTIONS = [
    'Rice','Wheat','Maize','Tomato','Potato','Cotton',
    'Sugarcane','Groundnut','Soybean','Banana','Mango',
    'Chilli','Onion','Brinjal','Cabbage','Other'
];

const SEV = {
    Healthy:  { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200',  Icon: CheckCircle },
    Mild:     { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', Icon: Info },
    Moderate: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', Icon: AlertTriangle },
    Severe:   { color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-200',    Icon: AlertTriangle },
    Unknown:  { color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',   Icon: Info },
};

const URGENCY = {
    'Immediate':      'bg-red-100 text-red-700',
    'Within 3 days':  'bg-orange-100 text-orange-700',
    'Within a week':  'bg-yellow-100 text-yellow-700',
    'Monitor only':   'bg-green-100 text-green-700',
    'Consult expert': 'bg-blue-100 text-blue-700',
};

export default function PlantDiseaseDetector() {
    const { lang } = useContext(LanguageContext);
    const [image, setImage]       = useState(null);
    const [cropName, setCropName] = useState('');
    const [result, setResult]     = useState(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const fileRef = useRef(null);

    const openGallery = () => {
        if (!fileRef.current) return;
        fileRef.current.removeAttribute('capture');
        fileRef.current.click();
    };

    const openCamera = () => {
        if (!fileRef.current) return;
        fileRef.current.setAttribute('capture', 'environment');
        fileRef.current.click();
    };

    const handleFile = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) { setError('Please upload a valid image (JPG, PNG, WebP).'); return; }
        if (file.size > 10 * 1024 * 1024) { setError('Image must be smaller than 10MB.'); return; }
        setError(null);
        setResult(null);
        setImage({ file, preview: URL.createObjectURL(file) });
    };

    const handleAnalyze = async () => {
        if (!image) { setError('Please upload a plant image first.'); return; }
        setLoading(true);
        setError(null);
        setResult(null);
        try {
            // Convert image to base64
            const toBase64 = (file) => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const b64 = await toBase64(image.file);
            const mimeType = image.file.type || 'image/jpeg';

            const groqKey = import.meta.env.VITE_GROQ_API_KEY;
            if (!groqKey) throw new Error('Groq API key not configured');

            const cropContext = cropName ? `The farmer says this is a ${cropName} plant. ` : '';
            const langMap = { ta: 'Tamil', hi: 'Hindi', te: 'Telugu', kn: 'Kannada' };
            const langNote = langMap[lang] ? `Provide the farmer_advice field in ${langMap[lang]}. Keep all other fields in English.` : '';

            const prompt = `You are an expert plant pathologist and agricultural scientist. ${cropContext}
Analyze this plant image carefully and provide a detailed disease diagnosis.
${langNote}

Respond ONLY with a valid JSON object in this exact format (no extra text):
{
  "disease_name": "Name of the disease or 'Healthy Plant' if no disease found",
  "confidence": 87,
  "severity": "Mild | Moderate | Severe | Healthy",
  "severity_percentage": 25,
  "affected_parts": "Leaves, Stem, etc.",
  "symptoms_observed": "Brief description of visible symptoms",
  "possible_causes": "Fungal / Bacterial / Viral / Environmental",
  "recommended_pesticides": ["Pesticide 1 (dosage)", "Pesticide 2 (dosage)"],
  "organic_treatment": "Organic/natural treatment option",
  "preventive_measures": ["Measure 1", "Measure 2", "Measure 3"],
  "crop_protection_advice": "Specific advice for protecting the crop",
  "yield_impact": "Estimated yield impact if untreated",
  "urgency": "Immediate | Within 3 days | Within a week | Monitor only",
  "farmer_advice": "Simple, friendly advice for the farmer in plain language"
}`;

            // Try vision-capable models in order
            const visionModels = [
                'meta-llama/llama-4-scout-17b-16e-instruct',
                'llama-4-scout-17b-16e-instruct',
                'llava-v1.5-7b-4096-preview',
            ];

            let rawContent = null;
            for (const model of visionModels) {
                try {
                    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${groqKey}`
                        },
                        body: JSON.stringify({
                            model,
                            messages: [{
                                role: 'user',
                                content: [
                                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${b64}` } },
                                    { type: 'text', text: prompt }
                                ]
                            }],
                            temperature: 0.3,
                            max_tokens: 1024
                        })
                    });
                    if (res.ok) {
                        const json = await res.json();
                        rawContent = json.choices[0].message.content.trim();
                        console.log(`Disease detection: used model ${model}`);
                        break;
                    }
                    console.warn(`Model ${model} returned ${res.status}`);
                } catch (e) {
                    console.warn(`Model ${model} failed:`, e);
                }
            }

            // If all vision models fail, use text-only fallback
            if (!rawContent) {
                const fallbackRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${groqKey}`
                    },
                    body: JSON.stringify({
                        model: 'llama-3.3-70b-versatile',
                        messages: [
                            { role: 'system', content: 'You are a plant disease expert. Respond only with valid JSON.' },
                            { role: 'user', content: `A farmer uploaded an image of a ${cropName || 'plant'} for disease analysis. Provide a general disease risk assessment. Return JSON with all fields: disease_name, confidence (50), severity, severity_percentage, affected_parts, symptoms_observed, possible_causes, recommended_pesticides (array), organic_treatment, preventive_measures (array), crop_protection_advice, yield_impact, urgency, farmer_advice.` }
                        ],
                        temperature: 0.4,
                        max_tokens: 800
                    })
                });
                if (fallbackRes.ok) {
                    const json = await fallbackRes.json();
                    rawContent = json.choices[0].message.content.trim();
                }
            }

            if (!rawContent) throw new Error('All AI models unavailable');

            // Parse JSON from response
            let parsed = rawContent;
            if (parsed.includes('```json')) parsed = parsed.split('```json')[1].split('```')[0].trim();
            else if (parsed.includes('```')) parsed = parsed.split('```')[1].split('```')[0].trim();

            const data = JSON.parse(parsed);
            data.status = 'success';
            setResult(data);

        } catch (err) {
            console.error('Disease detection error:', err);
            setError('Failed to analyze image. Check your connection and try again. (' + err.message + ')');
        } finally {
            setLoading(false);
        }
    };

    const reset = () => { setImage(null); setResult(null); setError(null); setCropName(''); };

    const cfg = result ? (SEV[result.severity] || SEV.Unknown) : null;

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Plant Disease Detection</h1>
                <p className="text-gray-500 text-sm mt-1">Upload a plant image for AI-powered disease diagnosis.</p>
            </div>

            <div className="max-w-4xl mx-auto flex flex-col gap-8 w-full">

                <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10">
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Detection Parameters</h2>
                    <p className="text-sm text-gray-500 mb-8">Select a crop and upload a clear photo of the affected plant part.</p>
                    <div className="space-y-5">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Crop Type <span className="text-gray-400 text-xs font-normal">(optional)</span></label>
                            <select value={cropName} onChange={e => setCropName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-full px-6 py-3 text-sm text-gray-700 focus:bg-white focus:ring-4 focus:ring-green-50 focus:border-green-500 outline-none transition-all font-medium">
                                <option value="">Select a crop</option>
                                {CROP_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Plant Image</label>
                            {!image ? (
                                <div onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                                    onDragOver={e => e.preventDefault()} onClick={openGallery}
                                    className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors">
                                    <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                                    <p className="text-sm font-medium text-gray-600">Tap to upload or drop image here</p>
                                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — max 10MB</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <img src={image.preview} alt="Plant" className="w-full h-52 object-cover rounded-2xl border border-gray-200" />
                                    <button onClick={reset} aria-label="Remove" className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-md hover:bg-red-50 transition-colors">
                                        <X className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            )}
                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                            <div className="grid grid-cols-2 gap-3 mt-3">
                                <button onClick={openGallery} className="flex items-center justify-center gap-2 border border-gray-200 bg-gray-50 rounded-full py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                                    <Upload className="w-4 h-4" /> Gallery
                                </button>
                                <button onClick={openCamera} className="flex items-center justify-center gap-2 border border-gray-200 bg-gray-50 rounded-full py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                                    <Camera className="w-4 h-4" /> Camera
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 space-y-1">
                            <p className="font-semibold text-blue-800">Tips for best results:</p>
                            <p>• Clear, well-lit photo of the affected leaf or plant part</p>
                            <p>• Capture both healthy and infected areas if possible</p>
                            <p>• Avoid blurry or dark images</p>
                        </div>

                        {error && (
                            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /><span>{error}</span>
                            </div>
                        )}

                        <button onClick={handleAnalyze} disabled={!image || loading}
                            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-black py-4 rounded-full transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-3 text-lg mt-2">
                            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Leaf className="w-5 h-5" /> Analyze Disease</>}
                        </button>
                    </div>
                </div>

                <div className="w-full">
                    {!result && !loading && (
                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 min-h-[300px] flex flex-col items-center justify-center text-center bg-white shadow-inner">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-8 ring-8 ring-green-50/50">
                                <Sprout className="w-12 h-12 text-green-600" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-3 tracking-tight">Awaiting Your Plant Image</h3>
                            <p className="text-sm font-medium text-gray-400 max-w-xs leading-relaxed">Upload a photo of your plant to get an AI-powered disease diagnosis.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="border-2 border-dashed border-gray-200 rounded-3xl p-10 min-h-[300px] flex flex-col items-center justify-center text-center bg-white shadow-inner">
                            <div className="relative mb-8">
                                <div className="w-24 h-24 rounded-full border-4 border-green-100 border-t-green-500 animate-spin" />
                                <Leaf className="w-10 h-10 text-green-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <h3 className="text-xl font-black text-gray-800 mb-3 tracking-tight">Analyzing your plant...</h3>
                            <p className="text-sm font-medium text-gray-400 max-w-xs">AI is examining the image for disease patterns.</p>
                        </div>
                    )}

                    {result && cfg && (
                        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
                            <div className="space-y-6">

                                <div className={[cfg.bg, cfg.border, 'flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-sm'].join(' ')}>
                                    <cfg.Icon className={['w-8 h-8 shrink-0', cfg.color].join(' ')} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className={['font-bold text-lg leading-tight', cfg.color].join(' ')}>{result.disease_name}</h3>
                                        <p className="text-sm text-gray-600 mt-0.5">
                                            {result.severity === 'Healthy' ? 'Plant appears healthy. Continue regular monitoring.' : 'Disease detected. Action recommended to protect your crop.'}
                                        </p>
                                    </div>
                                    {result.urgency && (
                                        <span className={['text-xs font-medium px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1', URGENCY[result.urgency] || 'bg-gray-100 text-gray-600'].join(' ')}>
                                            <Clock className="w-3 h-3" />{result.urgency}
                                        </span>
                                    )}
                                </div>

                                <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
                                    <Sprout className="w-12 h-12 text-blue-500 mb-2 opacity-80" />
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detection Confidence</span>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <span className="text-5xl font-extrabold text-gray-900">{result.confidence}</span>
                                        <span className="text-xl font-medium text-gray-500">%</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-2 max-w-sm">{result.symptoms_observed}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                        <AlertTriangle className="w-6 h-6 text-orange-500 mb-2" />
                                        <span className="text-xs text-gray-500 font-medium uppercase">Severity</span>
                                        <span className={['text-lg font-bold mt-1', cfg.color].join(' ')}>{result.severity}</span>
                                        <span className="text-xs text-gray-400">{result.severity_percentage}% infected</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-lg border border-gray-100 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
                                        <Info className="w-6 h-6 text-teal-500 mb-2" />
                                        <span className="text-xs text-gray-500 font-medium uppercase">Cause</span>
                                        <span className="text-lg font-bold text-gray-800 mt-1 leading-tight">{result.possible_causes || 'N/A'}</span>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100 shadow-sm overflow-hidden">
                                    <div className="bg-indigo-100/50 px-4 py-3 border-b border-indigo-200 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-indigo-600" />
                                        <h4 className="font-semibold text-indigo-900">Farmer Advisory</h4>
                                    </div>
                                    <div className="p-5 text-gray-800 text-sm leading-relaxed font-medium">{result.farmer_advice}</div>
                                </div>

                                {Array.isArray(result.recommended_pesticides) && result.recommended_pesticides.length > 0 && (
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                                            <FlaskConical className="w-5 h-5 text-purple-500" />
                                            <h4 className="font-semibold text-gray-800">Recommended Treatments</h4>
                                        </div>
                                        <div className="p-4">
                                            <ul className="space-y-3">
                                                {result.recommended_pesticides.map((p, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                                        <div className="mt-0.5 min-w-[20px] h-5 flex items-center justify-center bg-purple-100 rounded-full shrink-0">
                                                            <span className="text-purple-600 text-xs font-bold">{i + 1}</span>
                                                        </div>
                                                        <span className="leading-snug">{p}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {result.organic_treatment && (
                                                <div className="mt-4 bg-green-50 rounded-lg p-3 text-sm text-green-800">
                                                    <span className="font-semibold">Organic option: </span>{result.organic_treatment}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {Array.isArray(result.preventive_measures) && result.preventive_measures.length > 0 && (
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-green-600" />
                                            <h4 className="font-semibold text-gray-800">Preventive Measures & Crop Protection</h4>
                                        </div>
                                        <div className="p-4">
                                            <ul className="space-y-3">
                                                {result.preventive_measures.map((m, i) => (
                                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                                                        <div className="mt-0.5 min-w-[20px] h-5 flex items-center justify-center bg-blue-100 rounded-full shrink-0">
                                                            <span className="text-blue-600 text-xs font-bold">{i + 1}</span>
                                                        </div>
                                                        <span className="leading-snug">{m}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            {result.crop_protection_advice && (
                                                <div className="mt-4 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                                                    <span className="font-semibold">Crop protection: </span>{result.crop_protection_advice}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <button onClick={reset} className="w-full border border-green-500 text-green-600 hover:bg-green-50 font-semibold py-3 rounded-full transition-colors text-sm">
                                    Analyze Another Plant
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

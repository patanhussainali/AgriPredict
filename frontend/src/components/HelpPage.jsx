import { useState, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import { ChevronDown, ChevronUp, Mail, ExternalLink } from 'lucide-react';

const HelpPage = () => {
    const { t } = useContext(LanguageContext);

    // FAQ Data Structure
    const faqs = [
        {
            id: 1,
            questionKey: 'faqQ1',
            answerKey: 'faqA1'
        },
        {
            id: 2,
            questionKey: 'faqQ2',
            answerKey: 'faqA2'
        },
        {
            id: 3,
            questionKey: 'faqQ3',
            answerKey: 'faqA3'
        },
        {
            id: 4,
            questionKey: 'faqQ4',
            answerKey: 'faqA4'
        },
        {
            id: 5,
            questionKey: 'faqQ5',
            answerKey: 'faqA5'
        },
        {
            id: 6,
            questionKey: 'faqQ6',
            answerKey: 'faqA6'
        },
        {
            id: 7,
            questionKey: 'faqQ7',
            answerKey: 'faqA7'
        }
    ];

    const [openFaq, setOpenFaq] = useState(null);

    const toggleFaq = (id) => {
        setOpenFaq(openFaq === id ? null : id);
    };

    return (
        <div className="max-w-6xl mx-auto py-8 px-4 animate-fade-in-up">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-gray-900">{t.helpTitle}</h1>
                <p className="text-gray-500 mt-2">{t.helpSubtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: FAQs */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{t.faqTitle}</h2>

                    <div className="space-y-4">
                        {faqs.map((faq) => (
                            <div key={faq.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                <button
                                    onClick={() => toggleFaq(faq.id)}
                                    className="w-full flex items-center justify-between p-4 text-left bg-gray-50/50 hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-800">{t[faq.questionKey]}</span>
                                    {openFaq === faq.id ? (
                                        <ChevronUp className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>

                                {openFaq === faq.id && (
                                    <div className="p-4 bg-white border-t border-gray-100 text-gray-600 text-sm leading-relaxed">
                                        {t[faq.answerKey]}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column: Contact Info */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{t.contactTitle}</h2>

                    {/* Email Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-start gap-4">
                        <div className="p-3 bg-green-100 rounded-lg text-green-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{t.emailAddress}</h3>
                            <a href="mailto:agripredictcustomercare@gmail.com" className="text-gray-500 mt-1 hover:text-green-600 block transition-colors">
                                agripredictcustomercare@gmail.com
                            </a>
                        </div>
                    </div>



                </div>
            </div>
        </div>
    );
};

export default HelpPage;

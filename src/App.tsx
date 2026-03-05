import React, { useState, useEffect } from 'react';
import { 
  Smile, 
  Frown, 
  Meh, 
  History, 
  BarChart3, 
  Save, 
  Sparkles, 
  Trash2, 
  Download,
  BrainCircuit,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MoodEntry {
  id: number;
  mood: number;
  note: string;
  created_at: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

type Language = 'en' | 'bs';

const translations = {
  en: {
    title: "ZenTracker",
    subtitle: "Mental Wellness Companion",
    export: "Export Data",
    howFeeling: "How are you feeling today?",
    moodLevel: "Mood Level",
    struggling: "Struggling",
    balanced: "Balanced",
    thriving: "Thriving",
    noteLabel: "Daily Note (Optional)",
    notePlaceholder: "What's on your mind? Thoughts, feelings, or events...",
    saveBtn: "SAVE + GET AI INSIGHT",
    aiInsight: "Zen AI Insight",
    journal: "JOURNAL",
    analytics: "ANALYTICS",
    noEntries: "No entries yet. Start tracking your journey!",
    moodTrend: "Mood Trend",
    logEntriesTrend: "Log at least 2 entries to see trends.",
    avgMood: "Average Mood",
    totalLogs: "Total Logs",
    wellnessTips: "Wellness Quick Tips",
    tips: [
      "Try the 4-7-8 breathing technique to reduce stress.",
      "A 10-minute walk can significantly boost your serotonin.",
      "Write down 3 things you're grateful for today.",
      "Stay hydrated! Your brain is 75% water."
    ],
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    support: "Support",
    mood: "Mood",
    noNote: "No note added for this session."
  },
  bs: {
    title: "ZenTracker",
    subtitle: "Tvoj pratilac za mentalno zdravlje",
    export: "Izvezi podatke",
    howFeeling: "Kako se osjećaš danas?",
    moodLevel: "Nivo raspoloženja",
    struggling: "Teško mi je",
    balanced: "Uravnoteženo",
    thriving: "Odlično",
    noteLabel: "Dnevna bilješka (opciono)",
    notePlaceholder: "Šta ti je na umu? Misli, osjećanja ili događaji...",
    saveBtn: "SAČUVAJ + DOBIJ AI SAVJET",
    aiInsight: "Zen AI Savjet",
    journal: "DNEVNIK",
    analytics: "ANALITIKA",
    noEntries: "Još uvijek nema unosa. Započni svoje putovanje!",
    moodTrend: "Trend raspoloženja",
    logEntriesTrend: "Unesi bar 2 zapisa da vidiš trend.",
    avgMood: "Prosječno raspoloženje",
    totalLogs: "Ukupno zapisa",
    wellnessTips: "Brzi savjeti za dobrobit",
    tips: [
      "Probaj tehniku disanja 4-7-8 da smanjiš stres.",
      "Šetnja od 10 minuta može značajno povećati serotonin.",
      "Zapiši 3 stvari na kojima si zahvalan/na danas.",
      "Pij dovoljno vode! Tvoj mozak je 75% voda."
    ],
    privacy: "Politika privatnosti",
    terms: "Uslovi korištenja",
    support: "Podrška",
    mood: "Raspoloženje",
    noNote: "Nema bilješke za ovaj unos."
  }
};

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];
  const [mood, setMood] = useState(5);
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'history' | 'analytics'>('history');
  const [isSaving, setIsSaving] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/entries');
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error('Failed to fetch entries', err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood, note }),
      });
      const newEntry = await res.json();
      setEntries([newEntry, ...entries]);
      setNote('');
      
      // Generate AI Advice
      generateAdvice(mood, note, lang);
    } catch (err) {
      console.error('Failed to save entry', err);
    } finally {
      setIsSaving(false);
    }
  };

  const generateAdvice = async (currentMood: number, currentNote: string, currentLang: Language) => {
    setIsGeneratingAdvice(true);
    setAiAdvice(null);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `As a mental health companion named Zen AI, provide a short, supportive, and actionable piece of advice for a user who just logged a mood of ${currentMood}/10. 
        User's note: "${currentNote || 'No note provided'}"
        
        Keep it concise (2-3 sentences). Use a warm, empathetic tone. If the mood is low, be extra supportive. If high, celebrate with them. 
        Provide the response in the following language: ${currentLang === 'bs' ? 'Bosnian' : 'English'}.`,
      });
      setAiAdvice(response.text || "You're doing great! Keep taking care of yourself.");
    } catch (err) {
      console.error('AI Advice failed', err);
      // Fallback advice
      setAiAdvice("Take a deep breath. You are stronger than you think.");
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  const deleteEntry = async (id: number) => {
    try {
      await fetch(`/api/entries/${id}`, { method: 'DELETE' });
      setEntries(entries.filter(e => e.id !== id));
    } catch (err) {
      console.error('Failed to delete entry', err);
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Mood', 'Note'];
    const csvContent = [
      headers.join(','),
      ...entries.map(e => [
        new Date(e.created_at).toLocaleString(),
        e.mood,
        `"${e.note.replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `ZenTracker_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMoodIcon = (val: number) => {
    if (val >= 8) return <Smile className="text-emerald-500" />;
    if (val >= 5) return <Meh className="text-amber-500" />;
    return <Frown className="text-rose-500" />;
  };

  const chartData = [...entries].reverse().map(e => ({
    date: new Date(e.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    mood: e.mood,
    fullDate: new Date(e.created_at).toLocaleString()
  }));

  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | 'support' | null>(null);

  const Modal = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronRight className="rotate-90" size={24} />
          </button>
        </div>
        <div className="prose prose-slate max-w-none">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100">
      <AnimatePresence>
        {showLegal === 'privacy' && (
          <Modal title="Privacy Policy" onClose={() => setShowLegal(null)}>
            <p>Your privacy is important to us. ZenTracker Pro stores all your mood data locally in a secure database. We do not sell your data to third parties.</p>
            <h3>Data Collection</h3>
            <p>We collect mood levels and optional notes to provide you with analytics and AI-powered insights.</p>
            <h3>AI Processing</h3>
            <p>Your notes are processed by Google Gemini AI to generate supportive feedback. This data is handled according to Google's privacy standards.</p>
          </Modal>
        )}
        {showLegal === 'terms' && (
          <Modal title="Terms of Service" onClose={() => setShowLegal(null)}>
            <p>By using ZenTracker Pro, you agree to the following terms:</p>
            <ul>
              <li>The app is for informational purposes only and is not a substitute for professional medical advice.</li>
              <li>You are responsible for the data you input.</li>
              <li>We reserve the right to update the application and its features.</li>
            </ul>
          </Modal>
        )}
        {showLegal === 'support' && (
          <Modal title="Support" onClose={() => setShowLegal(null)}>
            <p>Need help? We're here for you.</p>
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
              <h4 className="text-emerald-800 font-bold mb-2">Contact Us</h4>
              <p className="text-emerald-700 text-sm">Email: support@zentracker.pro</p>
              <p className="text-emerald-700 text-sm">Response time: Within 24 hours</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
              <BrainCircuit className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">{t.title} <span className="text-emerald-500">Pro</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button 
                onClick={() => setLang('en')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                  lang === 'en' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                EN
              </button>
              <button 
                onClick={() => setLang('bs')}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                  lang === 'bs' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}
              >
                BS
              </button>
            </div>
            <button 
              onClick={exportCSV}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors text-sm font-medium border border-slate-200"
            >
              <Download size={16} />
              {t.export}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Input */}
        <div className="lg:col-span-5 space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Sparkles className="text-emerald-500" size={20} />
              {t.howFeeling}
            </h2>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium text-slate-500">{t.moodLevel}</span>
                  <span className={cn(
                    "text-4xl font-black",
                    mood >= 8 ? "text-emerald-500" : mood >= 5 ? "text-amber-500" : "text-rose-500"
                  )}>
                    {mood}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  <span>{t.struggling}</span>
                  <span>{t.balanced}</span>
                  <span>{t.thriving}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-500">{t.noteLabel}</label>
                <textarea 
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="w-full h-32 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none bg-slate-50/50"
                />
              </div>

              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 group"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                    {t.saveBtn}
                  </>
                )}
              </button>
            </div>
          </section>

          {/* AI Advice Card */}
          <AnimatePresence>
            {(isGeneratingAdvice || aiAdvice) && (
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-indigo-600 rounded-2xl p-6 shadow-xl shadow-indigo-100 text-white relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <BrainCircuit size={80} />
                </div>
                
                <h3 className="text-indigo-100 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Sparkles size={14} />
                  {t.aiInsight}
                </h3>

                {isGeneratingAdvice ? (
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-white/20 rounded w-3/4" />
                    <div className="h-4 bg-white/20 rounded w-1/2" />
                  </div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{aiAdvice || ''}</ReactMarkdown>
                  </div>
                )}
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: History & Analytics */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                  activeTab === 'history' ? "text-emerald-600 bg-emerald-50/50 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <History size={18} />
                {t.journal}
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={cn(
                  "flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
                  activeTab === 'analytics' ? "text-emerald-600 bg-emerald-50/50 border-b-2 border-emerald-500" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <BarChart3 size={18} />
                {t.analytics}
              </button>
            </div>

            <div className="p-6">
              {activeTab === 'history' ? (
                <div className="space-y-4">
                  {entries.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                        <History className="text-slate-300" size={32} />
                      </div>
                      <p className="text-slate-400 font-medium">{t.noEntries}</p>
                    </div>
                  ) : (
                    entries.map((entry) => (
                      <motion.div 
                        key={entry.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="group flex gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                      >
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                          {getMoodIcon(entry.mood)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(entry.created_at).toLocaleDateString(lang === 'bs' ? 'bs-BA' : 'en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <button 
                              onClick={() => deleteEntry(entry.id)}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-700">{t.mood}: {entry.mood}/10</span>
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-2 italic">
                            {entry.note || t.noNote}
                          </p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="h-[300px] w-full">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.moodTrend}</h3>
                    {entries.length < 2 ? (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-2xl">
                        <p className="text-slate-400 text-sm">{t.logEntriesTrend}</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="date" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                          />
                          <YAxis 
                            domain={[1, 10]} 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="mood" 
                            stroke="#10b981" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorMood)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.avgMood}</p>
                      <p className="text-2xl font-black text-slate-700">
                        {entries.length > 0 
                          ? (entries.reduce((acc, curr) => acc + curr.mood, 0) / entries.length).toFixed(1)
                          : '0.0'}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.totalLogs}</p>
                      <p className="text-2xl font-black text-slate-700">{entries.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Tips */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
              <BrainCircuit size={18} className="text-emerald-500" />
              {t.wellnessTips}
            </h3>
            <div className="space-y-3">
              {t.tips.map((tip, i) => (
                <div key={i} className="flex gap-3 items-start group cursor-default">
                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0 group-hover:scale-150 transition-transform" />
                  <p className="text-sm text-slate-500 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale">
            <BrainCircuit className="w-5 h-5" />
            <span className="font-bold text-sm">ZenTracker Pro v2.0</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <button onClick={() => setShowLegal('privacy')} className="hover:text-emerald-500 transition-colors">{t.privacy}</button>
            <button onClick={() => setShowLegal('terms')} className="hover:text-emerald-500 transition-colors">{t.terms}</button>
            <button onClick={() => setShowLegal('support')} className="hover:text-emerald-500 transition-colors">{t.support}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

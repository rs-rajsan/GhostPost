import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import axios from 'axios';
import { Sparkles, LayoutDashboard, Settings, Plus, History, Zap, Palette, Layers, ChevronDown, ArrowUp, Link2, FileText, Octagon, BarChart3, RotateCcw, Eye } from 'lucide-react';
import OutputDisplay from './components/OutputDisplay';
import Newsroom from './components/Newsroom';
import SettingsView from './components/Settings';
import Sessions from './components/Sessions';
import AdminDashboard from './components/AdminDashboard';
import Watchlist from './components/Watchlist';
import { useEnhance, type EnhanceResponse } from './hooks/useEnhance';

const queryClient = new QueryClient();
const API_BASE = 'http://localhost:5000/api/data';

interface FormValues {
    inputType: 'text' | 'topic' | 'article';
    text: string;
    mode: 'post' | 'article';
    targetPages: number;
    deepResearch: boolean;
    tone: 'professional' | 'conversational' | 'story' | 'bold';
}

function AppContent() {
    const [result, setResult] = useState<Partial<EnhanceResponse>>({});
    const [isGenerating, setIsGenerating] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [showToneMenu, setShowToneMenu] = useState(false);
    const [showModeMenu, setShowModeMenu] = useState(false);
    const [showInputTypeMenu, setShowInputTypeMenu] = useState(false);
    const [activeView, setActiveView] = useState<'enhance' | 'sessions' | 'pipelines' | 'settings' | 'admin' | 'watchlist'>('enhance');
    
    const [userName, setUserName] = useState('Ghost Writer');
    const enhanceMutation = useEnhance();

    const methods = useForm<FormValues>({
        defaultValues: {
            inputType: 'text',
            text: '',
            mode: 'post',
            targetPages: 0.5,
            deepResearch: false,
            tone: 'professional'
        }
    });

    const { register, watch, setValue } = methods;

    // Sequential Loader for Postgres Data
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await axios.get(`${API_BASE}/settings`);
                const settings = res.data;
                
                // 1. Theme
                if (settings.themeName && settings.themeName !== 'void') {
                    document.documentElement.classList.add(`theme-${settings.themeName}`);
                } else if (settings.themeHue) {
                    const hue = settings.themeHue;
                    const hsl = `${hue} 100% 60%`;
                    document.documentElement.style.setProperty('--plasma', `hsl(${hsl})`);
                    document.documentElement.style.setProperty('--plasma-dim', `hsla(${hsl}, 0.1)`);
                    document.documentElement.style.setProperty('--plasma-glow', `hsla(${hsl}, 0.05)`);
                }

                // 2. Identity
                if (settings.userName) setUserName(settings.userName);

                // 3. Last Session Params (if any)
                // Note: In Postgres we store these in a more structured way if needed, 
                // but for now we'll just keep them in form state.
            } catch (err) {
                // Silent failure to maintain UI stability
            }
        };
        loadInitialData();
    }, []);

    const currentTone = watch('tone');
    const currentMode = watch('mode');
    const currentInputType = watch('inputType');
    const deepResearch = watch('deepResearch');
    const targetPages = watch('targetPages');

    const handleGenerate = async (tone: string) => {
        const values = methods.getValues();
        if (!values.text || values.text.length < 5) {
            alert("Please provide a topic or text first.");
            return;
        }

        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);
        
        try {
            const requestId = crypto.randomUUID();
            const response = await enhanceMutation.mutateAsync({
                ...values,
                requestId,
                tone: tone as any,
                signal: controller.signal
            } as any);

            setResult(prev => ({
                ...prev,
                ...response
            }));

            // Persist the result to Postgres Pipeline for Sessions archive
            const toneKey = tone.charAt(0).toUpperCase() + tone.slice(1);
            const content = (response as any)[toneKey] || (response as any)[tone];
            
            if (content) {
                await axios.post(`${API_BASE}/pipeline`, {
                    topic: values.text.substring(0, 50) + (values.text.length > 50 ? '...' : ''),
                    status: 'posted', // Direct generation from Enhancer marks as posted
                    tone: tone,
                    mode: values.mode,
                    pages: values.targetPages,
                    article: content.enhancedPost,
                    hook: content.hook,
                    hookScore: content.hookScore,
                    confidenceScore: content.confidenceScore,
                    postedAt: new Date().toISOString()
                });
            }
            
            setIsGenerating(false);
            setAbortController(null);
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.message === 'canceled') {
            } else {
                const errorMsg = error.response?.data?.error || error.message || 'Generation failed';
                alert(`Error: ${errorMsg}`);
            }
            setIsGenerating(false);
            setAbortController(null);
        }
    };

    const handleStop = () => {
        if (abortController) {
            abortController.abort();
        }
    };

    const handleClear = () => {
        setValue('text', '');
        setResult({});
    };

    return (
        <div className="flex h-screen w-full bg-[var(--void-base)] text-[var(--text-1)] overflow-hidden font-sans">
            <FormProvider {...methods}>
                {/* SIDEBAR - Phase 2 */}
                <aside className="w-56 h-full flex flex-col bg-[var(--void-surface)] border-r border-[var(--border)] hidden md:flex">
                    <div className="p-6">
                        {/* Logo Row */}
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <div className="w-12 h-12 rounded-[6px] overflow-hidden flex items-center justify-center shadow-2xl shadow-[var(--plasma)]/30 border border-[var(--plasma)]/10">
                                <img src="/logo.png" alt="GhostPost Logo" className="w-full h-full object-cover scale-110" />
                            </div>
                            <div className="flex flex-col leading-[1.1]">
                                <span className="text-[var(--text-md)] font-light text-[var(--text-1)] tracking-tight">GhostPost</span>
                                <span className="text-[var(--text-md)] font-light text-[var(--plasma)] tracking-tight">Studio</span>
                            </div>
                        </div>


                    </div>
                    {/* Nav Section */}
                    <nav className="flex-1 px-3 mt-4 space-y-0.5">
                        <div className="text-[var(--text-xs)] text-[var(--text-3)] font-geist px-2 mb-2">
                            Workspace
                        </div>
                        
                        <button 
                            onClick={() => setActiveView('enhance')}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-r-[3px] text-[var(--text-sm)] transition-all font-light ${activeView === 'enhance' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)] border-l-2 border-[var(--plasma)]' : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/[0.03]'}`}
                        >
                            <LayoutDashboard size={14} />
                            Ghost Post
                        </button>
                        <button 
                            onClick={() => setActiveView('watchlist')}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] text-[var(--text-sm)] transition-all font-light ${activeView === 'watchlist' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)] border-l-2 border-[var(--plasma)]' : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/[0.03]'}`}
                        >
                            <Eye size={14} />
                            Source Watchlist
                        </button>
                        <button 
                            onClick={() => setActiveView('pipelines')}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] text-[var(--text-sm)] transition-all font-light ${activeView === 'pipelines' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)] border-l-2 border-[var(--plasma)]' : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/[0.03]'}`}
                        >
                            <Zap size={14} />
                            Pipelines
                        </button>
                        <button 
                            onClick={() => setActiveView('sessions')}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] text-[var(--text-sm)] transition-all font-light ${activeView === 'sessions' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)] border-l-2 border-[var(--plasma)]' : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/[0.03]'}`}
                        >
                            <History size={14} />
                            Sessions
                        </button>
                        <button 
                            onClick={() => setActiveView('settings')}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] text-[var(--text-sm)] transition-all font-light ${activeView === 'settings' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)] border-l-2 border-[var(--plasma)]' : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/[0.03]'}`}
                        >
                            <Settings size={14} />
                            Settings
                        </button>

                        <div className="text-[var(--text-xs)] text-[var(--text-3)] font-geist px-2 mb-2 mt-6">
                            Infrastructure
                        </div>
                        <button 
                            onClick={() => setActiveView('admin')}
                            className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-[3px] text-[var(--text-sm)] transition-all font-light ${activeView === 'admin' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)] border-l-2 border-[var(--plasma)]' : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-white/[0.03]'}`}
                        >
                            <BarChart3 size={14} />
                            Observability
                        </button>
                    </nav>

                    {/* User Footer */}
                    <div className="p-3 border-t border-[var(--border)]">
                        <div className="flex items-center gap-3 px-2 py-1.5 rounded-[6px] hover:bg-white/[0.03] cursor-pointer transition-all">
                            <div className="w-7 h-7 rounded-full bg-[var(--violet-dim)] border border-[var(--violet)]/30 text-[var(--violet)] font-geist text-[var(--text-xs)] flex items-center justify-center shrink-0">
                                {userName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[var(--text-sm)] font-light text-[var(--text-1)] truncate">{userName}</div>
                            </div>
                            <div className="text-[var(--text-xs)] bg-[var(--plasma-dim)] text-[var(--plasma)] px-1.5 py-0.5 rounded-[2px] font-geist font-light">
                                PRO
                            </div>
                        </div>
                    </div>
                </aside>

                {/* MAIN AREA */}
                <main className="flex-1 flex flex-col min-w-0 relative h-full">
                    {/* MAIN CONTENT AREA */}
                    {activeView === 'pipelines' ? (
                        <Newsroom />
                    ) : activeView === 'settings' ? (
                        <SettingsView />
                    ) : activeView === 'sessions' ? (
                        <Sessions />
                    ) : activeView === 'admin' ? (
                        <AdminDashboard />
                    ) : activeView === 'watchlist' ? (
                        <Watchlist />
                    ) : (
                        <>
                            {/* TOPBAR */}
                            <header className="border-b border-[var(--border)] px-5 py-3 flex justify-between items-center bg-[var(--void-base)]/80 backdrop-blur-md z-20">
                                <div>
                                    <h1 className="text-[var(--text-base)] font-light text-[var(--text-1)]">Content Studio</h1>
                                    <p className="text-[var(--text-sm)] text-[var(--text-3)] font-geist">Agentic pipeline · 4 tone variants</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-full">
                                        <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full animate-pulse" />
                                        <span className="text-[var(--text-xs)] font-light text-[var(--text-2)] tracking-wider">SYSTEM READY</span>
                                    </div>
                                    <div className="h-4 w-[1px] bg-[var(--border)]" />
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[var(--plasma-dim)] border border-[var(--plasma)]/20 flex items-center justify-center text-[var(--plasma)] font-light text-[var(--text-xs)]">
                                            RS
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[var(--text-xs)] font-light text-[var(--text-1)] leading-none mb-0.5">Raj S.</span>
                                            <span className="text-[var(--text-xs)] text-[var(--text-3)] leading-none">Pro Editor</span>
                                        </div>
                                    </div>
                                </div>
                            </header>

                            {/* OUTPUT AREA */}
                            <div className="flex-1 overflow-y-auto px-5 py-6">
                                <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
                                    {Object.keys(result).length === 0 && !isGenerating ? (
                                        <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                                            <Sparkles size={40} className="text-[var(--plasma)] mb-4" />
                                            <p className="text-[var(--text-base)] text-[var(--text-3)] font-light">Waiting for input</p>
                                            <p className="text-[var(--text-sm)] text-[var(--text-3)] italic mt-1 font-geist tracking-wide">Paste your ideas below and hit Generate</p>
                                        </div>
                                    ) : (
                                        <OutputDisplay
                                            data={result}
                                            activeTone={methods.watch('tone')}
                                            isPending={isGenerating}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* INPUT AREA */}
                            <div className="sticky bottom-0 bg-[var(--void-base)]/90 backdrop-blur-md border-t border-[var(--border)] px-5 py-4">
                                <div className="max-w-3xl mx-auto w-full">
                                    {/* Chips Row */}
                                    <div className="flex gap-2 mb-3">
                                        {/* Input Type Chip */}
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={() => setShowInputTypeMenu(!showInputTypeMenu)}
                                                className="flex items-center gap-1.5 px-3 py-1 border border-[var(--border)] hover:border-[var(--border-hover)] rounded-full text-[var(--text-sm)] text-[var(--text-2)] hover:text-[var(--text-1)] bg-transparent transition-all"
                                            >
                                                {currentInputType === 'text' ? <FileText size={12} /> : <Link2 size={12} />}
                                                <span>{currentInputType === 'text' ? 'Raw Text' : 'Article URL'}</span>
                                                <ChevronDown size={12} className={`transition-transform opacity-40 ${showInputTypeMenu ? 'rotate-180' : ''}`} />
                                            </button>
                                            {showInputTypeMenu && (
                                                <div className="absolute bottom-full mb-2 left-0 w-32 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] shadow-2xl overflow-hidden flex flex-col z-50">
                                                    <button onClick={() => { setValue('inputType', 'text'); setShowInputTypeMenu(false); }} className="px-3 py-1.5 text-left text-[var(--text-sm)] hover:bg-[var(--plasma-dim)] transition-colors flex items-center gap-2">
                                                        <FileText size={12} /> Raw Text
                                                    </button>
                                                    <button onClick={() => { setValue('inputType', 'article'); setShowInputTypeMenu(false); }} className="px-3 py-1.5 text-left text-[var(--text-sm)] hover:bg-[var(--plasma-dim)] transition-colors flex items-center gap-2">
                                                        <Link2 size={12} /> Article URL
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tone Chip */}
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={() => setShowToneMenu(!showToneMenu)}
                                                className="flex items-center gap-1.5 px-3 py-1 border border-[var(--border)] hover:border-[var(--border-hover)] rounded-full text-[var(--text-sm)] text-[var(--text-2)] hover:text-[var(--text-1)] bg-transparent transition-all"
                                            >
                                                <Palette size={12} />
                                                <span>Tone: <span className="text-[var(--plasma)] capitalize">{currentTone}</span></span>
                                                <ChevronDown size={12} className={`transition-transform opacity-40 ${showToneMenu ? 'rotate-180' : ''}`} />
                                            </button>
                                            {showToneMenu && (
                                                <div className="absolute bottom-full mb-2 left-0 w-32 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] shadow-2xl overflow-hidden flex flex-col z-50">
                                                    {['Professional', 'Conversational', 'Story', 'Bold'].map((t) => (
                                                        <button key={t} onClick={() => { setValue('tone', t.toLowerCase() as any); setShowToneMenu(false); }} className="px-3 py-1.5 text-left text-[var(--text-sm)] hover:bg-[var(--plasma-dim)] transition-colors capitalize">
                                                            {t}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Mode Chip */}
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={() => setShowModeMenu(!showModeMenu)}
                                                className="flex items-center gap-1.5 px-3 py-1 border border-[var(--border)] hover:border-[var(--border-hover)] rounded-full text-[var(--text-sm)] text-[var(--text-2)] hover:text-[var(--text-1)] bg-transparent transition-all"
                                            >
                                                <Layers size={12} />
                                                <span>Mode: <span className="text-[var(--plasma)] capitalize">{currentMode}</span></span>
                                                <ChevronDown size={12} className={`transition-transform opacity-40 ${showModeMenu ? 'rotate-180' : ''}`} />
                                            </button>
                                            {showModeMenu && (
                                                <div className="absolute bottom-full mb-2 left-0 w-44 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] shadow-2xl overflow-hidden flex flex-col z-50 p-1 gap-1">
                                                    <button onClick={() => { setValue('mode', 'post'); setShowModeMenu(false); }} className="px-2 py-1.5 text-left text-[var(--text-sm)] hover:bg-[var(--plasma-dim)] transition-colors rounded text-[var(--text-1)]">
                                                        Social Post
                                                    </button>
                                                    <button onClick={() => { setValue('mode', 'article'); setShowModeMenu(false); }} className="px-2 py-1.5 text-left text-[var(--text-sm)] hover:bg-[var(--plasma-dim)] transition-colors rounded text-[var(--text-1)]">
                                                        Full Article
                                                    </button>
                                                    
                                                    {currentMode === 'article' && (
                                                        <>
                                                            <div className="h-[1px] bg-[var(--border)] my-1" />
                                                            <div className="flex items-center justify-between px-2 py-1">
                                                                <span className="text-[var(--text-xs)] text-[var(--text-3)]">Target Pages</span>
                                                                <div className="flex items-center border border-[var(--border)] rounded-[2px] bg-[var(--void-base)] overflow-hidden">
                                                                    <button type="button" onClick={() => setValue('targetPages', Math.max(0.25, (Number(targetPages) || 0.5) - 0.25))} className="px-1.5 py-0.5 hover:text-[var(--plasma)] transition-colors border-r border-[var(--border)] text-[var(--text-xs)]">-</button>
                                                                    <span className="px-2 text-[var(--plasma)] text-[var(--text-xs)] font-mono font-light">{(Number(targetPages) || 0.5).toFixed(2)}</span>
                                                                    <button type="button" onClick={() => setValue('targetPages', Math.min(50, (Number(targetPages) || 0.5) + 0.25))} className="px-1.5 py-0.5 hover:text-[var(--plasma)] transition-colors border-l border-[var(--border)] text-[var(--text-xs)]">+</button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Deep Research Chip */}
                                        <button 
                                            type="button"
                                            onClick={() => setValue('deepResearch', !deepResearch)}
                                            className={`flex items-center gap-1.5 px-3 py-1 border rounded-full text-[var(--text-sm)] transition-all
                                                ${deepResearch 
                                                    ? 'border-[var(--success)] text-[var(--success)] bg-[var(--success)]/10' 
                                                    : 'border-[var(--border)] text-[var(--text-2)] hover:text-[var(--text-1)] bg-transparent hover:border-[var(--border-hover)]'
                                                }
                                            `}
                                        >
                                            <Sparkles size={12} />
                                            <span>Deep Research</span>
                                        </button>
                                    </div>

                                    {/* Input Box */}
                                    <div className="flex items-end gap-3 bg-[var(--void-surface-2)] border border-[var(--border)] focus-within:border-[var(--plasma)]/40 rounded-[8px] px-4 py-3 transition-all">
                                        <textarea
                                            {...register('text')}
                                            onInput={(e) => {
                                                const target = e.currentTarget;
                                                target.style.height = 'auto';
                                                target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    if (!isGenerating) handleGenerate(watch('tone') as any);
                                                }
                                            }}
                                            rows={1}
                                            placeholder={currentInputType === 'text' ? "Paste your ideas or drop an article URL..." : "https://example.com/article..."}
                                            className="flex-1 bg-transparent outline-none resize-none text-[var(--text-base)] text-[var(--text-1)] placeholder:text-[var(--text-3)] min-h-[24px] max-h-[120px] leading-relaxed font-sans"
                                        />

                                        <div className="flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={handleClear}
                                                className="w-8 h-8 rounded-[6px] flex-shrink-0 flex items-center justify-center bg-[var(--void-surface)] border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--text-1)] hover:border-[var(--border-hover)] transition-all"
                                                title="Clear Workspace"
                                            >
                                                <RotateCcw size={14} className="opacity-50" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={isGenerating ? handleStop : () => handleGenerate(watch('tone') as any)}
                                                className={`w-8 h-8 rounded-[6px] flex-shrink-0 flex items-center justify-center transition-all
                                                    ${isGenerating 
                                                        ? 'bg-red-500/20 border border-red-500/30 text-red-400 animate-pulse' 
                                                        : 'bg-[var(--plasma)] text-[var(--void-base)] hover:opacity-90'
                                                    }
                                                `}
                                            >
                                                {isGenerating ? <Octagon size={16} /> : <ArrowUp size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-center mt-2 text-[var(--text-xs)] text-[var(--text-3)] font-mono">
                                        GhostPost may produce errors · verify before publishing
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </FormProvider>
        </div>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppContent />
        </QueryClientProvider>
    );
}

export default App;

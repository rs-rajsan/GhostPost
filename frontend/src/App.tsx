import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm, FormProvider } from 'react-hook-form';
import { Sparkles, LayoutDashboard, Settings } from 'lucide-react';
import EnhancerForm from './components/EnhancerForm';
import OutputDisplay from './components/OutputDisplay';
import { useEnhance, type EnhanceResponse } from './hooks/useEnhance';

const queryClient = new QueryClient();

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
    const [statusMessage, setStatusMessage] = useState<string | null>("System Ready");
    const [isGenerating, setIsGenerating] = useState(false);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const enhanceMutation = useEnhance();

    const methods = useForm<FormValues>({
        defaultValues: {
            inputType: 'text',
            text: '',
            mode: 'post',
            targetPages: 1,
            deepResearch: false,
            tone: 'professional'
        }
    });

    const handleGenerate = async (tone: string) => {
        const values = methods.getValues();
        if (!values.text || values.text.length < 5) {
            alert("Please provide a topic or text first.");
            return;
        }

        const controller = new AbortController();
        setAbortController(controller);
        setIsGenerating(true);
        setStatusMessage(`GhostPost agents are working on your ${tone} variant...`);
        
        try {
            const response = await enhanceMutation.mutateAsync({
                ...values,
                requestId: crypto.randomUUID(),
                tone: tone as any,
                signal: controller.signal
            } as any);

            setResult(prev => ({
                ...prev,
                ...response
            }));
            
            setStatusMessage(null);
            setIsGenerating(false);
            setAbortController(null);
        } catch (error: any) {
            if (error.name === 'CanceledError' || error.message === 'canceled') {
                setStatusMessage("Generation Stopped");
                setTimeout(() => setStatusMessage(null), 2000);
            } else {
                const errorMsg = error.response?.data?.error || error.message || 'Generation failed';
                alert(`Error: ${errorMsg}`);
                setStatusMessage(null);
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

    return (
        <div className="min-h-screen flex bg-[#0a0a0a] text-white">
            <FormProvider {...methods}>
                {/* Sidebar */}
                <aside className="w-64 border-r border-white/5 flex flex-col z-10 hidden md:flex text-[13px]">
                    <div className="p-6 flex items-center gap-2 mb-6">
                        <div className="w-6 h-6 border border-primary/50 rounded flex items-center justify-center">
                            <Sparkles className="text-primary" size={14} />
                        </div>
                        <span className="text-gray-200">LinkEnhance</span>
                    </div>
                    <nav className="flex-1 px-4 space-y-2 text-gray-500">
                        <button className="w-full flex items-center gap-3 px-3 py-2 transition-colors text-primary border-b border-primary/20">
                            <LayoutDashboard size={16} />
                            Enhance Content
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 transition-colors hover:text-gray-300">
                            <Settings size={16} />
                            Settings
                        </button>
                    </nav>
                </aside>

                <main className="flex-1 flex flex-col h-screen overflow-hidden relative text-[13px]">
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 md:pt-2">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-2 border-b border-white/5 pb-1 flex justify-between items-end">
                                <div>
                                    <h2 className="text-gray-200 mb-0">
                                        Agentic Content Orchestrator
                                    </h2>
                                    <p className="text-gray-500 text-[11px]">
                                        Select a tone on the right to start the targeted enhancement pipeline.
                                    </p>
                                </div>
                                <span className="text-primary/70 text-[11px] font-medium animate-pulse">
                                    {statusMessage || 'System Ready'}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                <section className="relative">
                                    <EnhancerForm 
                                        isPending={isGenerating} 
                                        onGenerate={() => handleGenerate(methods.getValues().tone)}
                                        onStop={handleStop}
                                    />
                                </section>

                                <section className="relative xl:sticky xl:top-12">
                                    <OutputDisplay
                                        data={result}
                                        activeTone={methods.watch('tone')}
                                        isPending={isGenerating}
                                    />
                                </section>
                            </div>
                        </div>
                    </div>
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

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
}

function AppContent() {
    const [result, setResult] = useState<Partial<EnhanceResponse>>({});
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const enhanceMutation = useEnhance();

    const methods = useForm<FormValues>({
        defaultValues: {
            inputType: 'text',
            text: '',
            mode: 'post',
            targetPages: 1,
            deepResearch: false
        }
    });

    const handleGenerate = async (tone: string) => {
        const values = methods.getValues();
        if (!values.text || values.text.length < 5) {
            alert("Please provide a topic or text first.");
            return;
        }

        setIsGenerating(true);
        setStatusMessage(`GhostPost agents are working on your ${tone} variant...`);
        
        try {
            const response = await enhanceMutation.mutateAsync({
                ...values,
                requestId: crypto.randomUUID(),
                tone: tone as any
            });

            setResult(prev => ({
                ...prev,
                ...response
            }));
            
            setStatusMessage(null);
            setIsGenerating(false);
        } catch (error: any) {
            const errorMsg = error.response?.data?.error || error.message || 'Generation failed';
            alert(`Error: ${errorMsg}`);
            setStatusMessage(null);
            setIsGenerating(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-[#0a0a0a] text-white">
            <FormProvider {...methods}>
                {/* Sidebar */}
                <aside className="w-64 border-r border-white/10 flex flex-col glass z-10 hidden md:flex">
                    <div className="p-6 flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center">
                            <Sparkles className="text-white" size={16} />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            LinkEnhance
                        </h1>
                    </div>
                    <nav className="flex-1 px-4 space-y-2 text-sm font-medium text-gray-400">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-white/10 text-white">
                            <LayoutDashboard size={18} />
                            Enhance Content
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                            <Settings size={18} />
                            Settings
                        </button>
                    </nav>
                </aside>

                <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            <div className="mb-8">
                                <h2 className="text-title font-black mb-2 tracking-tight">
                                    Agentic Content Orchestrator
                                </h2>
                                <p className="text-gray-400 font-medium text-body">
                                    Select a tone on the right to start the targeted enhancement pipeline.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                                <section className="glass p-6 md:p-8 rounded-3xl z-10 relative">
                                    <EnhancerForm 
                                        statusMessage={statusMessage} 
                                        isPending={isGenerating} 
                                    />
                                </section>

                                <section className="relative z-10 xl:sticky xl:top-8">
                                    <OutputDisplay
                                        data={result}
                                        onGenerate={handleGenerate}
                                        isPending={isGenerating}
                                    />
                                </section>
                            </div>
                        </div>
                    </div>
                    {/* Glow Effects */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
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

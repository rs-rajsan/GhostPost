import { useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sparkles, Linkedin, LayoutDashboard, Settings, UserCircle } from 'lucide-react';
import EnhancerForm from './components/EnhancerForm';
import OutputDisplay from './components/OutputDisplay';

const queryClient = new QueryClient();

function AppContent() {
  const [result, setResult] = useState<any>(null);
  const formRef = useRef<any>(null);

  const handleEnhance = (data: any) => {
    setResult(data);
    // Smooth scroll to results on mobile
    if (window.innerWidth < 1024) {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleRegenerate = () => {
    // We can trigger the form submission again if we want to truly "regenerate"
    // For MVP, we'll just show the user how to do it or we can pass a trigger
    if (formRef.current) {
      formRef.current.submit();
    }
  };

    return (
        <div className="min-h-screen flex bg-[#0a0a0a] text-white">
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
                    <button 
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors bg-white/10 text-white"
                    >
                        <LayoutDashboard size={18} />
                        Enhance Post
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                        <Settings size={18} />
                        Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-white/10 mt-auto">
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                        <UserCircle size={20} />
                        Sign In
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="w-full p-4 flex justify-between items-center border-b border-white/10 glass md:hidden z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 premium-gradient rounded-lg flex items-center justify-center">
                            <Sparkles className="text-white" size={16} />
                        </div>
                        <h1 className="text-lg font-bold">LinkEnhance</h1>
                    </div>
                </header>

                {/* Scrollable Main Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h2 className="text-3xl font-extrabold mb-2 tracking-tight">
                                Enhance Your Ideas
                            </h2>
                            <p className="text-gray-400">
                                Paste raw text or notes below and instantly generate multiple post variations.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                            {/* Input Form Section */}
                            <section className="glass p-6 md:p-8 rounded-3xl z-10 relative">
                                <EnhancerForm onEnhance={handleEnhance} ref={formRef} />
                            </section>

                            {/* Output Results Section */}
                            <section className="relative z-10 xl:sticky xl:top-8">
                                {result ? (
                                    <OutputDisplay
                                        data={result}
                                        onRegenerate={handleRegenerate}
                                    />
                                ) : (
                                    <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-center opacity-50 border-dashed h-full min-h-[400px]">
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                            <Linkedin className="text-gray-500" size={32} />
                                        </div>
                                        <h3 className="text-xl font-semibold mb-2">Ready to Shine?</h3>
                                        <p className="text-gray-400 text-sm">
                                            Paste your thoughts on the left and click "Enhance Post" to see the magic happen.
                                        </p>
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>
                </div>

                {/* Background Glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
            </main>
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

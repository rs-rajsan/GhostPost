import { useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Sparkles, Linkedin, Github } from 'lucide-react';
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 premium-gradient rounded-xl flex items-center justify-center animate-float">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            LinkEnhance <span className="text-sm font-normal text-gray-500 uppercase tracking-widest ml-1">AI</span>
          </h1>
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <Github className="hover:text-white cursor-pointer transition-colors" size={20} />
          <div className="h-6 w-px bg-white/10" />
          <button className="text-sm font-medium hover:text-white transition-colors">Sign In</button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="text-center mb-12 max-w-2xl px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
          Turn messy thoughts into <span className="text-primary italic">authority</span>
        </h2>
        <p className="text-gray-400 text-lg">
          The #1 AI-powered enhancer for LinkedIn creators. Polish your raw ideas, optimize hooks, and boost engagement in seconds.
        </p>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <section className="glass p-6 md:p-8 rounded-3xl">
          <EnhancerForm onEnhance={handleEnhance} ref={formRef} />
        </section>

        <section className="relative">
          {result ? (
            <OutputDisplay
              data={result}
              onRegenerate={handleRegenerate}
            />
          ) : (
            <div className="glass p-12 rounded-3xl flex flex-col items-center justify-center text-center opacity-50 border-dashed">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Linkedin className="text-gray-500" size={32} />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to Shine?</h3>
              <p className="text-gray-400 text-sm">
                Paste your thoughts on the left and click "Enhance Post" to see the magic happen.
              </p>
            </div>
          )}

          {/* Background Glow */}
          <div className="absolute -z-10 -bottom-20 -right-20 w-80 h-80 bg-primary/20 blur-[100px] rounded-full" />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto pt-24 pb-8 text-gray-500 text-sm">
        &copy; 2026 LinkEnhance AI. Built for creators by creators.
      </footer>
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

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Link2, FileText, ChevronUp, ArrowRight, Octagon } from 'lucide-react';

interface EnhancerFormProps {
    isPending: boolean;
    apiError?: string | null;
    onGenerate: () => void;
    onStop: () => void;
}

export default function EnhancerForm({ isPending, apiError, onGenerate, onStop }: EnhancerFormProps) {
    const { register, formState: { errors }, watch, setValue } = useFormContext();
    const [showToneMenu, setShowToneMenu] = useState(false);
    const [showModeMenu, setShowModeMenu] = useState(false);

    const currentInputType = watch('inputType');
    const currentMode = watch('mode');
    const isArticle = currentMode === 'article';
    const deepResearch = watch('deepResearch');

    const targetPages = watch('targetPages');
    const currentTone = watch('tone');

    const tones = ['Professional', 'Conversational', 'Story', 'Bold'];

    const inputOptions = [
        { id: 'text', icon: FileText, label: 'Raw Text' },
        { id: 'article', icon: Link2, label: 'Web Article URL' },
    ];

    return (
        <div className="space-y-1.5 text-[13px] font-normal">
            {/* Row 1: Header (Input Selection) */}
            <div className="flex items-center justify-between py-[2px] border-t border-white/5 whitespace-nowrap">
                <div className="flex gap-6 items-center">
                    {inputOptions.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => setValue('inputType', option.id as any)}
                            className={`
                                flex items-center gap-2 py-0 transition-all whitespace-nowrap
                                ${currentInputType === option.id 
                                    ? 'text-primary' 
                                    : 'text-gray-500 hover:text-gray-300'}
                                ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                        >
                            <option.icon size={14} className="shrink-0" />
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Input Area - Simplified */}
            <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center text-gray-500 text-[11px]">
                    <label>{currentInputType === 'text' ? 'Your Ideas' : 'Article URL'}</label>
                    {currentInputType === 'text' && (
                        <span className="opacity-50">
                            {watch('text').length.toLocaleString()}/10,000
                        </span>
                    )}
                </div>
                <div className="relative group">
                    <textarea
                        {...register('text')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!isPending) onGenerate();
                            }
                        }}
                        placeholder={
                            currentInputType === 'text' ? "Paste your raw thoughts... (Press Enter to Generate)" : "https://example.com/article (Press Enter to Generate)"
                        }
                        className={`
                            w-full h-[500px] bg-white/5 p-2 pr-10 pb-12 text-gray-300 placeholder:text-gray-700 
                            focus:outline-none transition-all resize-none 
                            border border-white/10 rounded-[4px] focus:border-primary/30
                        `}
                    />
                    
                    {/* Bottom-Left Controls Container */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-4 z-20">
                        {/* Tone Selection Dropdown */}
                        <div className="relative flex flex-col items-start">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                    if (!isPending) {
                                        setShowToneMenu(!showToneMenu);
                                        setShowModeMenu(false);
                                    }
                                }}
                                className={`
                                    flex items-center gap-1.5 px-1 py-0.5 text-gray-500 hover:text-primary transition-all text-[11px] font-medium
                                    ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <span>Tone: <span className="text-primary capitalize">{currentTone}</span></span>
                                <ChevronUp size={10} className={`transition-transform ${showToneMenu ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showToneMenu && !isPending && (
                                <div className="absolute bottom-full mb-1 w-28 bg-[#1a1a1a] border border-white/10 rounded-[2px] shadow-xl overflow-hidden flex flex-col">
                                    {tones.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => {
                                                setValue('tone', t.toLowerCase());
                                                setShowToneMenu(false);
                                            }}
                                            className={`
                                                w-full text-left px-3 py-[1px] hover:bg-white/5 text-[11px] font-medium transition-colors
                                                ${currentTone === t.toLowerCase() ? 'text-primary' : 'text-gray-400'}
                                            `}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Mode Selection Dropdown */}
                        <div className="relative flex flex-col items-start">
                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => {
                                    if (!isPending) {
                                        setShowModeMenu(!showModeMenu);
                                        setShowToneMenu(false);
                                    }
                                }}
                                className={`
                                    flex items-center gap-1.5 px-1 py-0.5 text-gray-500 hover:text-primary transition-all text-[11px] font-medium
                                    ${isPending ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                            >
                                <span>Mode: <span className="text-primary capitalize">{currentMode === 'post' ? 'Social Post' : 'Full Article'}</span></span>
                                <ChevronUp size={10} className={`transition-transform ${showModeMenu ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {showModeMenu && !isPending && (
                                <div className="absolute bottom-full mb-1 w-36 bg-[#1a1a1a] border border-white/10 rounded-[2px] shadow-xl overflow-hidden flex flex-col p-1 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setValue('mode', 'post')}
                                        className={`w-full text-left px-2 py-0.5 rounded-[1px] text-[11px] transition-colors ${currentMode === 'post' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-gray-400'}`}
                                    >
                                        Social Post
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue('mode', 'article')}
                                        className={`w-full text-left px-2 py-0.5 rounded-[1px] text-[11px] transition-colors ${currentMode === 'article' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-gray-400'}`}
                                    >
                                        Full Article
                                    </button>
                                    
                                    <div className="h-[1px] bg-white/5 my-0.5" />
                                    
                                    {/* Deep Research Toggle inside Dropdown */}
                                    <div className="flex items-center justify-between px-2 py-0.5">
                                        <span className="text-gray-500 text-[10px]">Deep Research</span>
                                        <button
                                            type="button"
                                            onClick={() => setValue('deepResearch', !deepResearch)}
                                            className={`relative inline-flex h-3 w-6 items-center rounded-full transition-colors ${deepResearch ? 'bg-primary' : 'bg-white/10'}`}
                                        >
                                            <span className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform ${deepResearch ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>

                                    {/* Pages Stepper inside Dropdown (Conditional) */}
                                    {isArticle && (
                                        <div className="flex items-center justify-between px-2 py-0.5">
                                            <span className="text-gray-500 text-[10px]">Pages</span>
                                            <div className="flex items-center border border-white/10 rounded-[2px] bg-white/5 overflow-hidden">
                                                <button type="button" onClick={() => setValue('targetPages', Math.max(0.25, (Number(targetPages) || 1) - 0.25))} className="px-1 hover:text-primary transition-colors border-r border-white/10 text-[10px]">-</button>
                                                
                                                <div className="flex items-center px-1">
                                                    {/* Integer Part */}
                                                    <input 
                                                        type="text"
                                                        value={Math.floor(Number(targetPages) || 1)}
                                                        onFocus={(e) => e.target.select()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === '.') {
                                                                e.preventDefault();
                                                                (e.currentTarget.nextElementSibling?.nextElementSibling as HTMLInputElement)?.focus();
                                                            }
                                                        }}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                                            const dec = (Number(targetPages) || 1) % 1;
                                                            if (val === '') setValue('targetPages', 0 + dec);
                                                            else setValue('targetPages', Math.min(10, Number(val)) + dec);
                                                        }}
                                                        className="w-4 bg-transparent text-right text-primary text-[10px] font-bold outline-none"
                                                    />
                                                    
                                                    {/* Fixed Dot */}
                                                    <span className="text-primary/40 font-bold text-[10px] select-none mx-[0.5px]">.</span>
                                                    
                                                    {/* Decimal Part */}
                                                    <input 
                                                        type="text"
                                                        value={Math.round(((Number(targetPages) || 1) % 1) * 100).toString().padStart(2, '0')}
                                                        onFocus={(e) => e.target.select()}
                                                        onKeyDown={(e) => {
                                                            if (e.key === '.') e.preventDefault();
                                                        }}
                                                        onChange={(e) => {
                                                            const val = e.target.value.replace(/[^0-9]/g, '').slice(-2);
                                                            const int = Math.floor(Number(targetPages) || 1);
                                                            if (val === '') setValue('targetPages', int + 0);
                                                            else setValue('targetPages', int + (Number(val) / 100));
                                                        }}
                                                        className="w-5 bg-transparent text-left text-primary text-[10px] font-bold outline-none"
                                                    />
                                                </div>

                                                <button type="button" onClick={() => setValue('targetPages', Math.min(10, (Number(targetPages) || 1) + 0.25))} className="px-1 hover:text-primary transition-colors border-l border-white/10 text-[10px]">+</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom-Right Action Button */}
                    <button
                        type="button"
                        onClick={isPending ? onStop : onGenerate}
                        className={`
                            absolute bottom-3 right-3 p-1.5 rounded-full transition-all
                            ${isPending ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-primary/20 text-primary hover:bg-primary/40'}
                        `}
                    >
                        {isPending ? <Octagon size={14} /> : <ArrowRight size={14} />}
                    </button>
                </div>
                {errors.text && <p className="text-red-500/70 text-[11px]">{errors.text.message as string}</p>}
            </div>

            {apiError && (
                <div className="py-2 text-red-400 text-center border-t border-red-500/10">
                    {apiError}
                </div>
            )}
        </div>
    );
}

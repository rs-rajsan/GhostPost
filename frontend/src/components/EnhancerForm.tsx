import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { Sparkles, Link2, FileText, Lightbulb } from 'lucide-react';

interface EnhancerFormProps {
    statusMessage: string | null;
    isPending: boolean;
    apiError?: string | null;
}

export default function EnhancerForm({ statusMessage, isPending, apiError }: EnhancerFormProps) {
    const { register, formState: { errors }, watch, setValue } = useFormContext();

    // Form Watchers
    const currentInputType = watch('inputType');
    const currentMode = watch('mode');

    // Auto-enable Deep Research for Topic mode
    useEffect(() => {
        if (currentInputType === 'topic') {
            setValue('deepResearch', true);
        }
    }, [currentInputType, setValue]);

    const inputOptions = [
        { id: 'text', icon: FileText, label: 'Raw Text' },
        { id: 'topic', icon: Lightbulb, label: 'Topic' },
        { id: 'article', icon: Link2, label: 'Web Article URL' },
    ];

    return (
        <div className="space-y-6">
            {/* Input Type Selector */}
            <div className="flex bg-white/5 rounded-2xl p-1 gap-1 border border-white/10 mb-6">
                {inputOptions.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => setValue('inputType', option.id as any)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all
                            ${currentInputType === option.id 
                                ? 'bg-primary text-white shadow-lg' 
                                : 'text-gray-500 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <option.icon size={16} />
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Input Area */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-heading font-bold text-gray-400 uppercase tracking-widest">
                        {currentInputType === 'text' ? 'Your Ideas' : 
                         currentInputType === 'topic' ? 'Focus Topic' : 'Article URL'}
                    </label>
                    {currentInputType === 'text' && (
                        <span className="text-body text-[10px] text-gray-600 font-bold">
                            {watch('text').length}/200,000
                        </span>
                    )}
                </div>
                <textarea
                    {...register('text')}
                    placeholder={
                        currentInputType === 'text' ? "Paste your raw thoughts, LinkedIn draft, or meeting notes..." : 
                        currentInputType === 'topic' ? "e.g., The future of AI in content creation..." : 
                        "https://example.com/article-to-repurpose"
                    }
                    className={`
                        w-full h-48 bg-black/20 border-2 rounded-3xl p-6 text-gray-200 placeholder:text-gray-600 focus:outline-none transition-all resize-none font-medium text-body
                        ${errors.text ? 'border-red-500/50' : 'border-white/5 focus:border-primary/50 focus:shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]'}
                    `}
                />
                {errors.text && <p className="mt-2 text-body text-red-500">{errors.text.message as string}</p>}
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="space-y-4">
                    <label className="block text-heading font-bold text-gray-400 uppercase tracking-widest">Output Mode</label>
                    <div className="flex gap-2">
                        {['post', 'article'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setValue('mode', m as any)}
                                className={`
                                    flex-1 py-3 px-4 rounded-xl text-body font-bold border transition-all
                                    ${currentMode === m 
                                        ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(var(--primary-rgb),0.2)]' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}
                                `}
                            >
                                {m === 'post' ? 'Social Post' : 'Full Article'}
                            </button>
                        ))}
                    </div>
                </div>

                {currentMode === 'article' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-heading font-bold text-gray-400 uppercase tracking-widest">Target Length</label>
                            <span className="text-body font-black text-primary uppercase">{watch('targetPages')} Page</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            {...register('targetPages', { valueAsNumber: true })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                ) : (
                    <div className="space-y-4 opacity-30 cursor-not-allowed">
                        <div className="flex justify-between items-center">
                            <label className="block text-heading font-bold text-gray-600 uppercase tracking-widest">Target Length</label>
                            <span className="text-body font-black text-gray-700">NA</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-lg" />
                    </div>
                )}

                <div className={`flex items-center justify-between col-span-full md:col-span-1 pt-2 ${currentInputType === 'topic' ? 'opacity-75' : ''}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${watch('deepResearch') ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-heading font-black text-gray-200 uppercase tracking-wider">Deep Research</p>
                            <p className="text-body text-[10px] text-gray-500 font-medium">
                                {currentInputType === 'topic' ? 'Enabled for topics' : 'Gather facts & proven statistics'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        disabled={currentInputType === 'topic'}
                        onClick={() => setValue('deepResearch', !watch('deepResearch'))}
                        className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none
                            ${watch('deepResearch') ? 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]' : 'bg-white/10'}
                            ${currentInputType === 'topic' ? 'cursor-not-allowed' : ''}
                        `}
                    >
                        <span
                            className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${watch('deepResearch') ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </div>
            </div>

            {/* Simple Status Notification */}
            <div className="pt-4 border-t border-white/5 min-h-[100px] flex items-center justify-center">
                {isPending ? (
                    <div className="flex items-center gap-3 py-4 px-6 bg-white/5 rounded-2xl border border-white/10 animate-pulse">
                        <Sparkles className="text-primary" size={20} />
                        <p className="text-body font-bold text-gray-300">
                            {statusMessage || 'Agents are working on your content...'}
                        </p>
                    </div>
                ) : (
                    <div className="opacity-30 group flex flex-col items-center">
                        <Sparkles className="text-gray-500 mb-2 group-hover:text-primary transition-colors" size={24} />
                        <p className="text-body font-black text-gray-600 uppercase tracking-widest">
                            System Ready
                        </p>
                    </div>
                )}
            </div>

            {apiError && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-xs text-center font-bold uppercase tracking-widest">
                    {apiError}
                </div>
            )}
        </div>
    );
}

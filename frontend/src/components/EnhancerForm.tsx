import { forwardRef, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2, Link2, FileText, Youtube } from 'lucide-react';
import { useEnhance } from '../hooks/useEnhance';

const schema = z.object({
    inputType: z.enum(['text', 'article', 'youtube']),
    text: z.string().min(10, 'Input should be at least 10 characters').max(200000),
    mode: z.enum(['post', 'article']),
    targetPages: z.number().min(1).max(10),
    deepResearch: z.boolean()
});

type FormData = z.infer<typeof schema>;

const EnhancerForm = forwardRef(({ onEnhance }: { onEnhance: (data: any) => void }, ref) => {
    const mutation = useEnhance();

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            inputType: 'text',
            text: '',
            mode: 'post',
            targetPages: 2,
            deepResearch: false
        }
    });

    useImperativeHandle(ref, () => ({
        submit: () => {
            handleSubmit(onSubmit)();
        }
    }));

    const [apiError, setApiError] = useState<string | null>(null);

    const onSubmit = async (data: FormData) => {
        setApiError(null);
        try {
            const result = await mutation.mutateAsync(data);
            onEnhance(result);
        } catch (error: any) {
            setApiError(error.response?.data?.error || error.message || 'Failed to enhance post');
        }
    };

    // Form Watchers
    const currentInputType = watch('inputType');
    const currentMode = watch('mode');

    const inputOptions = [
        { id: 'text', icon: FileText, label: 'Raw Text' },
        { id: 'article', icon: Link2, label: 'Web Article URL' },
        { id: 'youtube', icon: Youtube, label: 'YouTube Video URL' },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Input Type Selector */}
            <div className="flex bg-white/5 rounded-2xl p-1 gap-1 border border-white/10 mb-6">
                {inputOptions.map((option) => (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                            setValue('inputType', option.id as any);
                            setValue('text', '');
                        }}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all
                            ${currentInputType === option.id
                                ? 'bg-primary/20 text-white shadow-lg border border-primary/50'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'}
                        `}
                    >
                        <option.icon size={16} />
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                ))}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    {currentInputType === 'text' && "Your Raw Thoughts"}
                    {currentInputType === 'article' && "Paste Web Article URL"}
                    {currentInputType === 'youtube' && "Paste YouTube Video URL"}
                </label>
                <div className="relative">
                    {currentInputType === 'text' ? (
                        <textarea
                            {...register('text')}
                            placeholder="Paste your messy notes, half-baked ideas, or a rough draft here..."
                            className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-gray-200 placeholder:text-gray-600"
                        />
                    ) : (
                         <input
                            type="url"
                            {...register('text')}
                            placeholder={currentInputType === 'youtube' ? "https://youtube.com/watch?v=..." : "https://example.com/article"}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-gray-200 placeholder:text-gray-600"
                        />
                    )}
                    
                    {currentInputType === 'text' && (
                        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                            {watch('text').length.toLocaleString()} / 200,000
                        </div>
                    )}
                </div>
                {errors.text && <p className="mt-2 text-sm text-red-500">{errors.text.message}</p>}
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-white/10">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300">Output Mode</label>
                    <div className="flex gap-2">
                        {['post', 'article'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setValue('mode', m as any)}
                                className={`
                                    flex-1 py-2 px-4 rounded-xl text-xs font-semibold border transition-all
                                    ${currentMode === m 
                                        ? 'bg-primary/20 border-primary text-white' 
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}
                                `}
                            >
                                {m === 'post' ? 'LinkedIn Post' : 'Detailed Article'}
                            </button>
                        ))}
                    </div>
                </div>

                {currentMode === 'article' ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-300">Target Length</label>
                            <span className="text-xs font-bold text-primary">{watch('targetPages')} Pages</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            {...register('targetPages', { valueAsNumber: true })}
                            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                ) : (
                    <div className="space-y-4 opacity-50 cursor-not-allowed">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-gray-500">Target Length</label>
                            <span className="text-xs font-bold text-gray-600">N/A for Posts</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-lg" />
                    </div>
                )}

                <div className="flex items-center justify-between col-span-full md:col-span-1 pt-2">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${watch('deepResearch') ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-500'}`}>
                            <Sparkles size={18} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-200">Deep Research</p>
                            <p className="text-[10px] text-gray-500">Gather facts & proven statistics</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setValue('deepResearch', !watch('deepResearch'))}
                        className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                            ${watch('deepResearch') ? 'bg-primary' : 'bg-white/10'}
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



            <button
                type="submit"
                disabled={mutation.isPending}
                className="w-full premium-gradient hover:opacity-90 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
                {mutation.isPending ? (
                    <>
                        <Loader2 className="animate-spin" size={20} />
                        Polishing your post...
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        Enhance Post
                    </>
                )}
            </button>
            {apiError && (
                <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-400 text-sm text-center font-medium">
                    {apiError}
                </div>
            )}
        </form>
    );
});

export default EnhancerForm;

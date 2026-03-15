import { forwardRef, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Loader2, Link2, FileText, Youtube } from 'lucide-react';
import { useEnhance } from '../hooks/useEnhance';

const schema = z.object({
    inputType: z.enum(['text', 'article', 'youtube']),
    text: z.string().min(10, 'Input should be at least 10 characters').max(50000)
});

type FormData = z.infer<typeof schema>;

const EnhancerForm = forwardRef(({ onEnhance }: { onEnhance: (data: any) => void }, ref) => {
    const mutation = useEnhance();

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            inputType: 'text',
            text: '',
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
            console.error('Failed to enhance post:', error);
            setApiError(error.response?.data?.error || error.message || 'Failed to enhance post');
        }
    };

    // Input Type Selection
    const currentInputType = watch('inputType');

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
                            {watch('text').length.toLocaleString()} / 50,000
                        </div>
                    )}
                </div>
                {errors.text && <p className="mt-2 text-sm text-red-500">{errors.text.message}</p>}
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

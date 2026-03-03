import { forwardRef, useImperativeHandle } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Sparkles, Loader2, MessageSquare, Briefcase, BookOpen, Zap } from 'lucide-react';
import { useEnhance } from '../hooks/useEnhance';

const schema = z.object({
    text: z.string().min(10, 'Your thoughts should be at least 10 characters').max(5000),
    tone: z.enum(['Professional', 'Conversational', 'Storytelling', 'Bold/Contrarian']),
});

type FormData = z.infer<typeof schema>;

const EnhancerForm = forwardRef(({ onEnhance }: { onEnhance: (data: any) => void }, ref) => {
    const mutation = useEnhance();

    const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            tone: 'Professional',
            text: '',
        }
    });

    useImperativeHandle(ref, () => ({
        submit: () => {
            handleSubmit(onSubmit)();
        }
    }));

    const onSubmit = async (data: FormData) => {
        try {
            const result = await mutation.mutateAsync(data);
            onEnhance(result);
        } catch (error) {
            console.error('Failed to enhance post:', error);
        }
    };

    const currentTone = watch('tone');

    const tones = [
        { id: 'Professional', icon: Briefcase, label: 'Professional' },
        { id: 'Conversational', icon: MessageSquare, label: 'Conversational' },
        { id: 'Storytelling', icon: BookOpen, label: 'Story' },
        { id: 'Bold/Contrarian', icon: Zap, label: 'Bold' },
    ];

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Your Raw Thoughts
                </label>
                <div className="relative">
                    <textarea
                        {...register('text')}
                        placeholder="Paste your messy notes, half-baked ideas, or a rough draft here..."
                        className="w-full h-64 bg-black/40 border border-white/10 rounded-2xl p-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-gray-200 placeholder:text-gray-600"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-gray-500">
                        {watch('text').length} / 5,000
                    </div>
                </div>
                {errors.text && <p className="mt-2 text-sm text-red-500">{errors.text.message}</p>}
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                    Select Tone
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {tones.map((tone) => (
                        <label
                            key={tone.id}
                            className={`
                flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all
                ${currentTone === tone.id
                                    ? 'bg-primary/20 border-primary text-white ring-1 ring-primary'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}
              `}
                        >
                            <input
                                type="radio"
                                {...register('tone')}
                                value={tone.id}
                                className="hidden"
                            />
                            <tone.icon size={20} className="mb-2" />
                            <span className="text-xs font-medium">{tone.label}</span>
                        </label>
                    ))}
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
        </form>
    );
});

export default EnhancerForm;

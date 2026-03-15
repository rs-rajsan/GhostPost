import { useState } from 'react';
import { Copy, Check, Info, RefreshCcw, Loader2, Briefcase, MessageSquare, BookOpen, Zap } from 'lucide-react';
import type { EnhanceResponse } from '../hooks/useEnhance';

interface OutputDisplayProps {
    data: EnhanceResponse;
    onRegenerate: () => void;
    isPending?: boolean;
}

type ToneType = keyof EnhanceResponse;

export default function OutputDisplay({ data, onRegenerate, isPending }: OutputDisplayProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<ToneType>('Professional');

    const tones: { id: ToneType; icon: any; label: string }[] = [
        { id: 'Professional', icon: Briefcase, label: 'Professional' },
        { id: 'Conversational', icon: MessageSquare, label: 'Conversational' },
        { id: 'Storytelling', icon: BookOpen, label: 'Story' },
        { id: 'Bold/Contrarian', icon: Zap, label: 'Bold' },
    ];

    const currentData = data[activeTab];

    const copyToClipboard = () => {
        const fullText = `${currentData.enhancedPost}\n\n${currentData.hashtags.join(' ')}`;
        navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6">
            {/* Tabs */}
            <div className="flex bg-white/5 rounded-2xl p-1 gap-1 border border-white/10">
                {tones.map((tone) => (
                    <button
                        key={tone.id}
                        onClick={() => setActiveTab(tone.id)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-medium transition-all
                            ${activeTab === tone.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'}
                        `}
                    >
                        <tone.icon size={16} />
                        <span className="hidden sm:inline">{tone.label}</span>
                    </button>
                ))}
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 gap-4">
                <div className="glass p-4 rounded-2xl flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hook Score</p>
                        <p className="text-2xl font-bold text-green-400">{currentData.hookScore}/10</p>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-white/5 flex items-center justify-center relative">
                        <div
                            className="absolute inset-0 rounded-full border-4 border-green-500 transition-all duration-500"
                            style={{ clipPath: `inset(0 ${100 - (currentData.hookScore * 10)}% 0 0)` }}
                        />
                    </div>
                </div>
                <div className="glass p-4 rounded-2xl flex items-start gap-3">
                    <Info className="text-primary mt-1 shrink-0" size={16} />
                    <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hook Tip</p>
                        <p className="text-xs text-gray-300 leading-tight">{currentData.hookTip}</p>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="glass rounded-3xl overflow-hidden flex flex-col">
                <div className="bg-white/5 p-4 flex justify-between items-center border-b border-white/10">
                    <h4 className="text-sm font-medium text-gray-400">Enhanced Post</h4>
                    <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check size={14} className="text-green-500" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy size={14} />
                                Copy Post
                            </>
                        )}
                    </button>
                </div>
                <div className="p-6 bg-black/20 min-h-[300px] text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {currentData.enhancedPost}

                    <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap gap-2">
                        {currentData.hashtags.map((tag) => (
                            <span key={tag} className="text-sm text-primary font-medium hover:underline cursor-pointer">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4">
                <button
                    onClick={onRegenerate}
                    disabled={isPending}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                    {isPending ? (
                        <Loader2 className="animate-spin" size={18} />
                    ) : (
                        <RefreshCcw size={18} />
                    )}
                    Regenerate All Variants
                </button>
            </div>
        </div>
    );
}

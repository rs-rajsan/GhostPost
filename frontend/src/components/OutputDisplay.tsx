import { useState } from 'react';
import { Copy, Check, Info, RefreshCcw, Loader2, Briefcase, MessageSquare, BookOpen, Zap, Download, Wand2, Sparkles } from 'lucide-react';
import type { EnhanceResponse } from '../hooks/useEnhance';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { useGenerateHook } from '../hooks/useEnhance';

interface OutputDisplayProps {
    data: EnhanceResponse;
    onRegenerate: () => void;
    isPending?: boolean;
}

type ToneType = keyof EnhanceResponse;

export default function OutputDisplay({ data, onRegenerate, isPending }: OutputDisplayProps) {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<ToneType>('Professional');
    const [generatedHooks, setGeneratedHooks] = useState<Record<string, string>>({});
    const generateHookMutation = useGenerateHook();

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

    const handleGenerateHook = async () => {
        try {
            const result = await generateHookMutation.mutateAsync({
                text: currentData.enhancedPost,
                tone: activeTab,
                hookTip: currentData.hookTip
            });
            setGeneratedHooks(prev => ({
                ...prev,
                [activeTab]: result.hook
            }));
        } catch (error) {
            console.error('Failed to generate hook:', error);
        }
    };

    const downloadWord = async () => {
        try {
            console.log('Starting Word document generation...');
            
            const parseLineToTextRuns = (line: string): TextRun[] => {
                const cleaned = line.replace(/^\s*[-*]\s+/, '').replace(/^\s*#+\s+/, '').replace(/^\d+\.\s+/, '');
                const segments = cleaned.split(/(\*\*.*?\*\*)/g);
                
                return segments.map(seg => {
                    if (seg.startsWith('**') && seg.endsWith('**')) {
                        return new TextRun({ text: seg.slice(2, -2), bold: true });
                    }
                    return new TextRun(seg);
                });
            };

            const children = [
                new Paragraph({
                    text: "GhostPost: Enhanced Content",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 },
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Tone: ${activeTab}`, bold: true }),
                        new TextRun({ text: ` | Generated on: ${new Date().toLocaleDateString()}`, color: "666666" }),
                    ],
                    spacing: { after: 400 },
                }),
            ];

            currentData.enhancedPost.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (!trimmed) return;

                if (line.startsWith('# ')) {
                    children.push(new Paragraph({ 
                        text: line.replace('# ', ''), 
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 240, after: 120 }
                    }));
                } else if (line.startsWith('## ')) {
                    children.push(new Paragraph({ 
                        text: line.replace('## ', ''), 
                        heading: HeadingLevel.HEADING_3,
                        spacing: { before: 200, after: 100 }
                    }));
                } else if (line.startsWith('### ')) {
                    children.push(new Paragraph({ 
                        text: line.replace('### ', ''), 
                        heading: HeadingLevel.HEADING_4,
                        spacing: { before: 160, after: 80 }
                    }));
                } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    children.push(new Paragraph({ 
                        children: parseLineToTextRuns(line),
                        bullet: { level: 0 },
                        spacing: { after: 120 }
                    }));
                } else {
                    children.push(new Paragraph({ 
                        children: parseLineToTextRuns(line),
                        spacing: { after: 200 }
                    }));
                }
            });

            children.push(new Paragraph({
                children: [
                    new TextRun({ 
                        text: currentData.hashtags.join(' '), 
                        color: "0066CC",
                        italics: true 
                    }),
                ],
                spacing: { before: 400 },
            }));

            const doc = new Document({
                sections: [{
                    properties: {},
                    children: children,
                }],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `GhostPost_${activeTab}_${new Date().getTime()}.docx`);
        } catch (error) {
            console.error('Error generating Word doc:', error);
            alert(`Failed to generate Word document.`);
        }
    };

    const downloadPDF = async () => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            let cursorY = 55;

            const addHeader = (pageNum: number) => {
                doc.setFontSize(22);
                doc.setFont("helvetica", "bold");
                doc.setTextColor(40, 40, 40);
                doc.text('GhostPost: Enhanced Content', margin, 30);
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(150, 150, 150);
                doc.text(`Tone: ${activeTab} | Page ${pageNum}`, pageWidth - margin - 20, 30);
                
                doc.setLineWidth(0.5);
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, 35, pageWidth - margin, 35);
            };

            addHeader(1);

            const lines = currentData.enhancedPost.split('\n');
            lines.forEach((line: string) => {
                if (!line.trim()) {
                    cursorY += 5;
                    return;
                }

                if (cursorY > pageHeight - margin) {
                    doc.addPage();
                    addHeader(doc.internal.pages.length - 1);
                    cursorY = 45;
                }

                let cleanLine = line;
                let fontSize = 11;
                let fontStyle = "normal";

                if (line.startsWith('# ')) {
                    cleanLine = line.replace('# ', '');
                    fontSize = 18;
                    fontStyle = "bold";
                    cursorY += 5;
                } else if (line.startsWith('## ')) {
                    cleanLine = line.replace('## ', '');
                    fontSize = 14;
                    fontStyle = "bold";
                    cursorY += 3;
                } else if (line.startsWith('### ')) {
                    cleanLine = line.replace('### ', '');
                    fontSize = 12;
                    fontStyle = "bold";
                    cursorY += 2;
                } else if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    cleanLine = "• " + line.trim().substring(2);
                }

                cleanLine = cleanLine.replace(/\*\*/g, '');

                doc.setFontSize(fontSize);
                doc.setFont("helvetica", fontStyle);
                doc.setTextColor(60, 60, 60);

                const wrappedLines = doc.splitTextToSize(cleanLine, maxWidth);
                doc.text(wrappedLines, margin, cursorY);
                cursorY += (wrappedLines.length * (fontSize / 2)) + 2;
            });

            if (cursorY > pageHeight - margin - 15) {
                doc.addPage();
                addHeader(doc.internal.pages.length - 1);
                cursorY = 45;
            }
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(0, 102, 204);
            const hashtagLines = doc.splitTextToSize(currentData.hashtags.join(' '), maxWidth);
            doc.text(hashtagLines, margin, cursorY + 5);

            doc.save(`GhostPost_${activeTab}_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Failed to generate PDF.');
        }
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
                <div className="glass p-4 rounded-2xl space-y-3">
                    <div className="flex items-start gap-3">
                        <Info className="text-primary mt-1 shrink-0" size={16} />
                        <div className="flex-1">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Hook Tip</p>
                            <p className="text-xs text-gray-300 leading-tight mb-2">{currentData.hookTip}</p>
                            
                            {!generatedHooks[activeTab] ? (
                                <button
                                    onClick={handleGenerateHook}
                                    disabled={generateHookMutation.isPending}
                                    className="flex items-center gap-1.5 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
                                >
                                    {generateHookMutation.isPending ? (
                                        <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                        <Wand2 size={12} />
                                    )}
                                    Generate Custom Hook
                                </button>
                            ) : (
                                <div className="mt-2 p-2 bg-primary/10 border border-primary/20 rounded-xl relative group">
                                    <p className="text-[11px] text-white font-medium leading-relaxed pr-6 italic">
                                        "{generatedHooks[activeTab]}"
                                    </p>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedHooks[activeTab]);
                                        }}
                                        className="absolute top-2 right-2 text-primary/60 hover:text-primary transition-opacity"
                                        title="Copy Hook"
                                    >
                                        <Copy size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
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
                <div className="p-6 bg-black/20 min-h-[300px] max-h-[700px] overflow-y-auto text-gray-200 whitespace-pre-wrap leading-relaxed custom-scrollbar">
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

            {/* Export Options */}
            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={downloadPDF}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                    <Download size={18} className="text-primary" />
                    Download PDF
                </button>
                <button
                    onClick={downloadWord}
                    className="flex-1 premium-gradient hover:opacity-90 text-white font-medium py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                >
                    <Download size={18} />
                    Download Word (Recommended)
                </button>
            </div>

            <button
                onClick={onRegenerate}
                disabled={isPending}
                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 text-sm py-3 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
                {isPending ? (
                    <Loader2 className="animate-spin" size={16} />
                ) : (
                    <RefreshCcw size={16} />
                )}
                Regenerate All Variants
            </button>
        </div>
    );
}

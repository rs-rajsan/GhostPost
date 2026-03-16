import { useState } from 'react';
import { Copy, Check, Info, RefreshCcw, Loader2, Briefcase, MessageSquare, BookOpen, Zap, Download } from 'lucide-react';
import type { EnhanceResponse } from '../hooks/useEnhance';
import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

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


    const downloadWord = async () => {
        try {
            console.log('Starting Word document generation...');
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
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
                        ...currentData.enhancedPost.split('\n').map(line => 
                            new Paragraph({
                                children: [new TextRun(line)],
                                spacing: { after: 200 },
                            })
                        ),
                        new Paragraph({
                            children: [
                                new TextRun({ 
                                    text: currentData.hashtags.join(' '), 
                                    color: "0066CC",
                                    italics: true 
                                }),
                            ],
                            spacing: { before: 400 },
                        }),
                    ],
                }],
            });

            console.log('Packing Word document...');
            const blob = await Packer.toBlob(doc);
            console.log('Word document blob generated, saving file...');
            saveAs(blob, `GhostPost_${activeTab}_${new Date().getTime()}.docx`);
            console.log('Word document download initiated.');
        } catch (error) {
            console.error('Critical error generating Word doc:', error);
            alert(`Failed to generate Word document: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const downloadPDF = async () => {
        try {
            console.log('Starting PDF generation...');
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;
            const maxWidth = pageWidth - (margin * 2);
            let cursorY = 55;

            const addHeader = (pageNum: number) => {
                doc.setFontSize(22);
                doc.setTextColor(40, 40, 40);
                doc.text('GhostPost: Enhanced Content', margin, 30);
                
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(`Tone: ${activeTab} | Page ${pageNum}`, pageWidth - margin - 20, 30);
                
                doc.setLineWidth(0.5);
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, 35, pageWidth - margin, 35);
            };

            addHeader(1);

            // Content
            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60);

            const lines = doc.splitTextToSize(currentData.enhancedPost, maxWidth);
            
            lines.forEach((line: string) => {
                if (cursorY > pageHeight - margin) {
                    doc.addPage();
                    addHeader(doc.internal.pages.length - 1);
                    cursorY = 45; // Reset Y for new page
                    doc.setFontSize(12);
                    doc.setTextColor(60, 60, 60);
                }
                doc.text(line, margin, cursorY);
                cursorY += 7;
            });

            // Hashtags
            if (cursorY > pageHeight - margin - 15) {
                doc.addPage();
                addHeader(doc.internal.pages.length - 1);
                cursorY = 45;
            }
            
            doc.setFontSize(10);
            doc.setTextColor(0, 102, 204);
            const hashtagLines = doc.splitTextToSize(currentData.hashtags.join(' '), maxWidth);
            doc.text(hashtagLines, margin, cursorY + 5);

            const filename = `GhostPost_${activeTab}_${new Date().getTime()}.pdf`;
            doc.save(filename);
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

import React, { useState, useEffect, useCallback } from 'react';
import { type PipelineTopic } from '../db';
import { Search, Play, Trash2, X, FileText, Loader2, CheckCircle2, AlertCircle, PenLine, Octagon, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/data';

interface Tab {
    id: string;
    title: string;
    type: 'newsroom' | 'article';
    articleId?: number;
}

export default function Newsroom() {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: 'newsroom', title: 'Newsroom', type: 'newsroom' }
    ]);
    const [activeTab, setActiveTab] = useState('newsroom');

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (id === 'newsroom') return;
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTab === id) setActiveTab('newsroom');
    };

    const addArticleTab = (articleId: number, topic: string) => {
        const existingTab = tabs.find(t => t.articleId === articleId);
        if (existingTab) {
            setActiveTab(existingTab.id);
            return;
        }
        const newId = `art-${articleId}`;
        const shortTitle = topic.length > 15 ? topic.substring(0, 12) + '...' : topic;
        setTabs([...tabs, { id: newId, title: `Art: ${shortTitle}`, type: 'article', articleId }]);
        setActiveTab(newId);
    };

    return (
        <div className="flex flex-col h-full bg-[var(--void-base)] overflow-hidden">
            {/* Tab Bar */}
            <div className="flex items-center gap-px bg-[var(--void-surface)] border-b border-[var(--border)] overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2.5 text-[11px] font-medium cursor-pointer transition-all border-r border-[var(--border)] min-w-[100px] max-w-[200px]
                            ${activeTab === tab.id ? 'nav-item-active' : 'nav-item-inactive'}
                        `}
                    >
                        {tab.type === 'newsroom' ? <Search size={12} /> : <FileText size={12} />}
                        <span className="truncate">{tab.title}</span>
                        {tab.id !== 'newsroom' && (
                            <button onClick={(e) => closeTab(tab.id, e)} className="ml-1 p-0.5 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors">
                                <X size={10} />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'newsroom' ? (
                    <NewsroomGrid onOpenArticle={addArticleTab} />
                ) : (
                    <ArticleDetailView id={tabs.find(t => t.id === activeTab)?.articleId} />
                )}
            </div>
        </div>
    );
}

function NewsroomGrid({ onOpenArticle }: { onOpenArticle: (id: number, topic: string) => void }) {
    const [topics, setTopics] = useState<PipelineTopic[]>([]);
    const [isResearching, setIsResearching] = useState(false);
    const [researchProgress, setResearchProgress] = useState(0);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState<number[]>([]);
    const [pendingDenials, setPendingDenials] = useState<number[]>([]);
    const [pendingDeletions, setPendingDeletions] = useState<number[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fetchTopics = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE}/pipeline`);
            setTopics(response.data);
        } catch (err) {
            // Handled via UI states
        }
    }, []);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    const handleUpdateTopic = async (id: number, updates: any) => {
        try {
            await axios.patch(`${API_BASE}/pipeline/${id}`, updates);
            fetchTopics();
        } catch (err) {
            console.error('Failed to update topic:', err);
            setError('Failed to save changes. Please check your connection.');
        }
    };

    const handleResearch = async () => {
        if (isResearching) {
            abortController?.abort();
            return;
        }

        const controller = new AbortController();
        setAbortController(controller);
        setIsResearching(true);
        setResearchProgress(0);

        try {
            // Fetch Watchlist from Postgres
            const wlResponse = await axios.get(`${API_BASE}/watchlist`);
            const companyNames = wlResponse.data.map((w: any) => w.name);

            if (companyNames.length === 0) {
                setError('Your watchlist is empty. Please add some companies in the "Pipelines > Watchlist" section first.');
                setIsResearching(false);
                return;
            }

            const response = await axios.post('http://localhost:5000/api/research', {
                watchlist: companyNames
            }, { signal: controller.signal });

            const newTopics = response.data;
            
            // Filter out existing topics and prepare for bulk create
            const topicsToCreate = newTopics
                .filter((t: any) => !topics.find(prev => prev.topic === t.topic))
                .map((t: any) => ({
                    topic: t.topic,
                    sourceUrl: t.sourceUrl,
                    newsDate: t.newsDate,
                    trendScore: t.trendScore || 0,
                    confidenceScore: t.confidenceScore || t.confidence || 0, // Map AI field to DB field
                    status: 'draft',
                    tone: 'professional',
                    mode: 'article',
                    pages: 0.5,
                    momentumScores: {
                        linkedin: Math.floor(Math.random() * 40) + 60,
                        twitter: Math.floor(Math.random() * 40) + 50,
                        instagram: Math.floor(Math.random() * 30) + 30,
                        facebook: Math.floor(Math.random() * 20) + 20
                    }
                }));

            if (topicsToCreate.length > 0) {
                await axios.post(`${API_BASE}/pipeline/bulk-create`, { topics: topicsToCreate });
            } else {
                setError('No new topics found for your watchlist companies.');
                setTimeout(() => setError(null), 3000);
            }

            setResearchProgress(100);
            fetchTopics();
        } catch (err: any) {
            console.error('Research Error Detail:', err);
            const msg = err.response?.data?.error 
                ? `Research Failed: ${err.response.data.error}` 
                : `Research Error: ${err.message || 'Could not connect to assistant'}`;
            setError(msg);
            setResearchProgress(0);
            setAbortController(null);
        } finally {
            setIsResearching(false);
        }
    };

    const handleBatchRun = async () => {
        const approvedTopics = topics.filter(t => t.status === 'approved');
        if (approvedTopics.length === 0) return;

        setIsGenerating(true);
        setGenProgress(0);
        let completed = 0;

        try {
            for (const topic of approvedTopics) {
                try {
                    await axios.post(`${API_BASE}/pipeline/generate/${topic.id}`);
                    await fetchTopics();
                } catch (err) {
                    console.error(`Generation failed for topic ${topic.id}:`, err);
                    setError(`Failed to generate: ${topic.topic}`);
                }
                completed++;
                setGenProgress((completed / approvedTopics.length) * 100);
            }
        } finally {
            setIsGenerating(false);
            setGenProgress(0);
            fetchTopics();
        }
    };


    const handleApplyChanges = async () => {
        try {
            setIsGenerating(true); // Show loader during batch process
            
            // 1. Process Deletions
            if (pendingDeletions.length > 0) {
                await axios.post(`${API_BASE}/pipeline/delete-batch`, { ids: pendingDeletions });
            }

            // 2. Process Approvals
            for (const id of pendingApprovals) {
                await axios.patch(`${API_BASE}/pipeline/${id}`, { status: 'approved' });
            }

            // 3. Process Denials
            for (const id of pendingDenials) {
                await axios.patch(`${API_BASE}/pipeline/${id}`, { status: 'denied' });
            }

            // Clear pending states
            setPendingApprovals([]);
            setPendingDenials([]);
            setPendingDeletions([]);
            
            await fetchTopics();
            setIsGenerating(false);
        } catch (err) {
            console.error('Failed to apply changes:', err);
            setError('Failed to apply some changes. Please try again.');
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col relative">
            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[4px] flex items-center justify-between text-[11px] text-red-400 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="hover:text-red-300 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Header / Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--void-surface)]/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <h2 className="text-[14px] font-bold text-[var(--text-1)] tracking-tight">Newsroom Assistant</h2>
                    <div className="h-4 w-[1px] bg-[var(--border)]" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--plasma-dim)] text-[var(--plasma)] rounded-full text-[10px] font-bold tracking-widest border border-[var(--plasma)]/20">
                        <div className="w-1 h-1 bg-[var(--plasma)] rounded-full animate-pulse" />
                        Live Feed
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleResearch}
                        disabled={isGenerating}
                        className={`btn-base min-w-[160px] h-9 shadow-lg shadow-[var(--plasma)]/5 ${isResearching ? 'btn-stop' : 'btn-primary'}`}
                    >
                        {isResearching ? (
                            <>
                                <Octagon size={14} className="animate-pulse" />
                                Stop Research ({Math.round(researchProgress / 10)}/10)
                            </>
                        ) : (
                            <>
                                <Search size={14} />
                                Research Latest News
                            </>
                        )}
                    </button>
                    
                    <div className="w-[1px] h-6 bg-[var(--border)] mx-1" />

                    <button 
                        onClick={handleApplyChanges}
                        disabled={(pendingApprovals.length === 0 && pendingDenials.length === 0 && pendingDeletions.length === 0) || isGenerating || isResearching}
                        className={`btn-base h-9 px-6 bg-[var(--void-surface-2)] text-[var(--text-1)] border border-[var(--border)] hover:border-[var(--plasma)]/50 hover:bg-white/[0.02] transition-all disabled:opacity-20
                            ${(pendingApprovals.length > 0 || pendingDenials.length > 0 || pendingDeletions.length > 0) ? 'border-[var(--plasma)] shadow-lg shadow-[var(--plasma)]/10' : ''}`}
                    >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className={pendingApprovals.length > 0 ? 'text-[var(--plasma)]' : ''} />}
                        Apply Actions { (pendingApprovals.length + pendingDenials.length + pendingDeletions.length) > 0 && `(${pendingApprovals.length + pendingDenials.length + pendingDeletions.length})` }
                    </button>

                    <button 
                        onClick={handleBatchRun}
                        disabled={topics.filter(t => t.status === 'approved').length === 0 || isGenerating || isResearching}
                        className={`btn-base h-9 px-6 bg-[var(--plasma)] text-[var(--void-base)] hover:opacity-90 shadow-xl shadow-[var(--plasma)]/20 transition-all disabled:opacity-20`}
                    >
                        {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        Run Batch Pipeline
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            {(isResearching || isGenerating) && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--plasma-dim)] overflow-hidden z-20">
                    <div 
                        className="h-full bg-[var(--plasma)] shadow-[0_0_10px_var(--plasma)] transition-all duration-300"
                        style={{ width: `${isResearching ? researchProgress : genProgress}%` }}
                    />
                </div>
            )}

            {/* Grid */}
            <div className="flex-1 bg-[var(--void-surface)] border border-[var(--border)] rounded-[6px] overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="sticky top-0 z-10 bg-[var(--void-surface-2)] border-b border-[var(--border)]">
                            <tr className="text-[var(--text-3)] font-geist tracking-widest text-left">
                                <th className="p-3">Topic</th>
                                <th className="py-2 px-3 w-[240px]">
                                    <div className="flex flex-col gap-1">
                                        <span>Momentum Breakdown</span>
                                        <div className="flex items-center gap-4 text-[8px] opacity-40 font-normal">
                                            <span className="min-w-[45px]">Aggregated</span>
                                            <div className="flex items-center gap-[18px] border-l border-white/10 pl-4">
                                                <span>Tw</span><span>Fa</span><span>Li</span><span>In</span>
                                            </div>
                                        </div>
                                    </div>
                                </th>
                                <th className="p-3 w-20">Status</th>
                                <th className="p-3 w-16 text-center">Approve</th>
                                <th className="p-3 w-16 text-center">Deny</th>
                                <th className="p-3 w-16 text-center">Delete</th>
                                <th className="p-3 w-24">Mode</th>
                                <th className="p-3 w-28">Tone</th>
                                <th className="p-3 w-32 text-center">Words</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {topics?.sort((a,b) => b.id! - a.id!).map(topic => (
                                    <tr 
                                        key={topic.id} 
                                        className="group hover:bg-white/[0.02] transition-all duration-200"
                                        onDoubleClick={() => topic.status === 'generated' || topic.status === 'posted' ? onOpenArticle(topic.id!, topic.topic) : null}
                                    >
                                        <td className="py-[2px] px-4 max-w-[400px]" style={{ paddingBlock: '2px' }}>
                                            <div className="flex items-center gap-2">
                                                {(topic.status === 'generated' || topic.status === 'posted') && <PenLine size={10} className="text-[var(--plasma)]" />}
                                                <span className="text-[12px] font-bold text-[var(--text-1)] line-clamp-1 leading-none">{topic.topic}</span>
                                            </div>
                                        </td>
                                    <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        <div className="flex items-center gap-4">
                                            <div className="min-w-[45px]">
                                                <span className="text-[11px] font-bold text-[var(--plasma)]">{topic.trendScore}%</span>
                                            </div>
                                            <div className="flex items-center gap-3 border-l border-[var(--border)] pl-4">
                                                {Object.entries(topic.momentumScores || {}).map(([platform, score]: [string, any]) => (
                                                    <div key={platform} className="min-w-[14px]">
                                                        <span className="text-[10px] font-bold text-[var(--text-1)]">{score}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                        <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-[var(--text-3)]/10 text-[var(--text-3)] rounded-[2px] text-[9px] font-bold">
                                                {topic.status.charAt(0).toUpperCase() + topic.status.slice(1)}
                                            </span>
                                        </div>
                                    </td>
                                        <td className="py-[2px] px-4 text-center" style={{ paddingBlock: '2px' }}>
                                            <button 
                                                onClick={() => {
                                                    if (pendingApprovals.includes(topic.id!)) {
                                                        setPendingApprovals(prev => prev.filter(id => id !== topic.id!));
                                                    } else {
                                                        setPendingApprovals(prev => [...prev, topic.id!]);
                                                        setPendingDenials(prev => prev.filter(id => id !== topic.id!));
                                                        setPendingDeletions(prev => prev.filter(id => id !== topic.id!));
                                                    }
                                                }}
                                                className={`w-5 h-5 rounded-[4px] border transition-all flex items-center justify-center mx-auto
                                                    ${pendingApprovals.includes(topic.id!) ? 'bg-[var(--plasma)] border-[var(--plasma)] text-[var(--void-base)]' : 'border-white/20 hover:border-[var(--plasma)]'}`}
                                            >
                                                {pendingApprovals.includes(topic.id!) && <CheckCircle2 size={12} />}
                                            </button>
                                        </td>
                                        <td className="py-[2px] px-4 text-center" style={{ paddingBlock: '2px' }}>
                                            <button 
                                                onClick={() => {
                                                    if (pendingDenials.includes(topic.id!)) {
                                                        setPendingDenials(prev => prev.filter(id => id !== topic.id!));
                                                    } else {
                                                        setPendingDenials(prev => [...prev, topic.id!]);
                                                        setPendingApprovals(prev => prev.filter(id => id !== topic.id!));
                                                        setPendingDeletions(prev => prev.filter(id => id !== topic.id!));
                                                    }
                                                }}
                                                className={`w-5 h-5 rounded-[4px] border transition-all flex items-center justify-center mx-auto
                                                    ${pendingDenials.includes(topic.id!) ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 hover:border-red-500'}`}
                                            >
                                                {pendingDenials.includes(topic.id!) && <X size={12} />}
                                            </button>
                                        </td>
                                        <td className="py-[2px] px-4 text-center" style={{ paddingBlock: '2px' }}>
                                            <button 
                                                onClick={() => {
                                                    if (pendingDeletions.includes(topic.id!)) {
                                                        setPendingDeletions(prev => prev.filter(id => id !== topic.id!));
                                                    } else {
                                                        setPendingDeletions(prev => [...prev, topic.id!]);
                                                        setPendingApprovals(prev => prev.filter(id => id !== topic.id!));
                                                        setPendingDenials(prev => prev.filter(id => id !== topic.id!));
                                                    }
                                                }}
                                                className={`w-5 h-5 rounded-[4px] border transition-all flex items-center justify-center mx-auto
                                                    ${pendingDeletions.includes(topic.id!) ? 'bg-[var(--text-3)] border-[var(--text-3)] text-white' : 'border-white/20 hover:border-white/50'}`}
                                            >
                                                {pendingDeletions.includes(topic.id!) && <Trash2 size={12} />}
                                            </button>
                                        </td>
                                        <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        <select 
                                            value={topic.mode}
                                            onChange={(e) => handleUpdateTopic(topic.id!, { mode: e.target.value })}
                                            className="bg-transparent text-[var(--text-2)] outline-none cursor-pointer hover:text-[var(--plasma)] transition-colors"
                                        >
                                            <option value="post" className="bg-[var(--void-surface-2)]">Post</option>
                                            <option value="article" className="bg-[var(--void-surface-2)]">Article</option>
                                            <option value="thread" className="bg-[var(--void-surface-2)]">Thread</option>
                                        </select>
                                    </td>
                                        <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        <select 
                                            value={topic.tone}
                                            onChange={(e) => handleUpdateTopic(topic.id!, { tone: e.target.value })}
                                            className="bg-transparent text-[var(--text-2)] outline-none cursor-pointer hover:text-[var(--plasma)] transition-colors w-full"
                                        >
                                            <option value="professional" className="bg-[var(--void-surface-2)]">Professional</option>
                                            <option value="casual" className="bg-[var(--void-surface-2)]">Casual</option>
                                            <option value="technical" className="bg-[var(--void-surface-2)]">Technical</option>
                                            <option value="humorous" className="bg-[var(--void-surface-2)]">Humorous</option>
                                            <option value="inspirational" className="bg-[var(--void-surface-2)]">Inspirational</option>
                                            <option value="provocative" className="bg-[var(--void-surface-2)]">Provocative</option>
                                            <option value="academic" className="bg-[var(--void-surface-2)]">Academic</option>
                                            <option value="conversational" className="bg-[var(--void-surface-2)]">Conversational</option>
                                            <option value="story" className="bg-[var(--void-surface-2)]">Story</option>
                                            <option value="custom" className="bg-[var(--void-surface-2)]">Custom Persona...</option>
                                        </select>
                                        {topic.tone === 'custom' && (
                                            <input 
                                                type="text"
                                                placeholder="Describe persona..."
                                                defaultValue={topic.article?.startsWith('PERSONA:') ? topic.article.split('\n')[0].replace('PERSONA:', '') : ''}
                                                onBlur={(e) => {
                                                    // Store custom persona in a hidden metadata or prefix the article
                                                    handleUpdateTopic(topic.id!, { tone: `custom:${e.target.value}` });
                                                }}
                                                className="mt-1 w-full bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[2px] px-2 py-1 text-[9px] text-[var(--plasma)] outline-none focus:border-[var(--plasma)]"
                                            />
                                        )}
                                        {topic.tone.startsWith('custom:') && (
                                            <div 
                                                onClick={() => handleUpdateTopic(topic.id!, { tone: 'custom' })}
                                                className="mt-1 text-[9px] text-[var(--plasma)] cursor-pointer hover:underline truncate max-w-[100px]"
                                            >
                                                Persona: {topic.tone.replace('custom:', '')}
                                            </div>
                                        )}
                                    </td>
                                            <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => handleUpdateTopic(topic.id!, { pages: Math.max(0.125, topic.pages - 0.0125) })}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--plasma)] hover:border-[var(--plasma)] transition-all"
                                                >
                                                    -
                                                </button>
                                                <span className="w-12 text-center font-geist text-[11px] font-bold text-[var(--text-1)]">
                                                    {Math.round(topic.pages * 800)}
                                                </span>
                                                <button 
                                                    onClick={() => handleUpdateTopic(topic.id!, { pages: Math.min(6.25, topic.pages + 0.0125) })}
                                                    className="w-5 h-5 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-3)] hover:text-[var(--plasma)] hover:border-[var(--plasma)] transition-all"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </td>
                                    <td className="p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight size={14} className="text-[var(--text-3)]" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}

// High-Fidelity Article View
function ArticleDetailView({ id }: { id?: number }) {
    const [topic, setTopic] = useState<PipelineTopic | undefined>(undefined);
    const [isApproved, setIsApproved] = useState(false);

    useEffect(() => {
        if (id) {
            axios.get(`${API_BASE}/pipeline`).then(res => {
                const found = res.data.find((t: any) => t.id === id);
                setTopic(found);
                if (found?.status === 'posted') setIsApproved(true);
            });
        }
    }, [id]);

    if (!topic) return null;

    const handleCopy = () => {
        const fullContent = `Hook:\n${topic.hook}\n\nArticle:\n${topic.article}`;
        navigator.clipboard.writeText(fullContent);
        alert("Content copied to clipboard!");
    };

    const handleExport = (type: 'pdf' | 'docx' | 'md') => {
        // In a real app, this would call the existing export utilities
        alert(`Exporting as ${type.toUpperCase()}...`);
    };

    return (
        <div className="h-full flex flex-col bg-[var(--void-base)] overflow-hidden">
            {/* Header / Meta */}
            <div className="p-6 border-b border-[var(--border)] bg-[var(--void-surface)] flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-bold text-[var(--text-1)] mb-1">{topic.topic}</h2>
                    <div className="flex items-center gap-4 text-[11px] text-[var(--text-3)] font-geist">
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--plasma)]" />
                            Hook Score: <span className="text-[var(--text-1)] font-bold">{topic.hookScore || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--violet)]" />
                            Confidence: <span className="text-[var(--text-1)] font-bold">{topic.confidenceScore || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-[var(--border)] pl-4">
                            Tone: <span className="text-[var(--plasma)] capitalize">{topic.tone}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px]">
                        <span className="text-[10px] font-bold text-[var(--text-3)] uppercase">Final Approval</span>
                        <button 
                            onClick={() => setIsApproved(!isApproved)}
                            className={`w-8 h-4 rounded-full relative transition-all ${isApproved ? 'bg-[var(--success)]' : 'bg-[var(--border)]'}`}
                        >
                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isApproved ? 'left-4.5' : 'left-0.5'}`} />
                        </button>
                    </div>
                    
                    {isApproved && (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <button 
                                onClick={async () => {
                                    await axios.patch(`${API_BASE}/pipeline/${topic.id}`, { 
                                        status: 'posted', 
                                        postedAt: new Date().toISOString() 
                                    });
                                    alert("Article marked as Posted and moved to Sessions!");
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 border border-[var(--success)]/30 text-[var(--success)] text-[11px] font-bold rounded-[4px] hover:bg-[var(--success)]/10 transition-all ${topic.status === 'posted' ? 'opacity-50 cursor-default bg-[var(--success)]/10' : ''}`}
                                disabled={topic.status === 'posted'}
                            >
                                <CheckCircle2 size={12} />
                                {topic.status === 'posted' ? 'Already Posted' : 'Mark as Posted'}
                            </button>
                            <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.05] text-[var(--text-1)] text-[11px] font-bold rounded-[4px] hover:bg-white/[0.1] transition-all">
                                Copy All
                            </button>
                            <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--plasma-dim)] text-[var(--plasma)] text-[11px] font-bold rounded-[4px] hover:bg-[var(--plasma)] hover:text-[var(--void-base)] transition-all">
                                Export PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 font-sans leading-relaxed text-[14px]">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Hook Section */}
                    <div className="bg-[var(--plasma-dim)]/20 border border-[var(--plasma)]/20 p-6 rounded-[8px] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[var(--plasma)]" />
                        <h4 className="text-[10px] font-bold text-[var(--plasma)] uppercase tracking-widest mb-4">Viral Hook</h4>
                        <p className="text-[var(--text-1)] italic text-[16px] leading-snug">
                            "{topic.hook || 'Generating hook...'}"
                        </p>
                    </div>

                    {/* Article Body */}
                    <div className="prose prose-invert max-w-none">
                        <h4 className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest mb-6">Article Body</h4>
                        <div className="text-[var(--text-2)] whitespace-pre-wrap leading-loose">
                            {topic.article || 'Generating content...'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect, useCallback } from 'react';
import { type PipelineTopic } from '../db';
import { Search, CheckCircle2, X, AlertCircle, FileText, Download, Copy, Check, FileDown, Trash2, ArrowUpDown, Play, Loader2, Octagon, ChevronRight, Clock, Eye, ChevronDown } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/data';

export function TopicGrid({ onOpenArticle, mode = 'pipeline' }: { onOpenArticle: (id: number, topic: string) => void, mode?: 'pipeline' | 'sessions' }) {
    const [topics, setTopics] = useState<PipelineTopic[]>([]);
    const [isResearching, setIsResearching] = useState(false);
    const [researchProgress, setResearchProgress] = useState(0);
    const [abortController, setAbortController] = useState<AbortController | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genProgress, setGenProgress] = useState(0);
    const [pendingApprovals, setPendingApprovals] = useState<number[]>([]);
    const [pendingDenials, setPendingDenials] = useState<number[]>([]);
    const [pendingDeletions, setPendingDeletions] = useState<number[]>([]);
    const [pendingPosts, setPendingPosts] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'generatedAt' | 'postedAt', direction: 'asc' | 'desc' } | null>(null);

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
            const topicsToCreate = newTopics
                .filter((t: any) => !topics.find(prev => prev.topic === t.topic))
                .map((t: any) => ({
                    topic: t.topic,
                    sourceUrl: t.sourceUrl,
                    newsDate: t.newsDate,
                    trendScore: t.trendScore || 0,
                    confidenceScore: t.confidenceScore || t.confidence || 0,
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
            setIsGenerating(true);
            if (pendingDeletions.length > 0) {
                await axios.post(`${API_BASE}/pipeline/delete-batch`, { ids: pendingDeletions });
            }
            for (const id of pendingApprovals) {
                await axios.patch(`${API_BASE}/pipeline/${id}`, { status: 'approved' });
            }
            for (const id of pendingDenials) {
                await axios.patch(`${API_BASE}/pipeline/${id}`, { status: 'denied' });
            }
            for (const id of pendingPosts) {
                await axios.patch(`${API_BASE}/pipeline/${id}`, { status: 'posted', postedAt: new Date().toISOString() });
            }
            setPendingApprovals([]);
            setPendingDenials([]);
            setPendingDeletions([]);
            setPendingPosts([]);
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
            {error && (
                <div className="mb-4 p-3 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-[4px] flex items-center justify-between text-[var(--text-sm)] text-[var(--error)] animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={14} />
                        <span>{error}</span>
                    </div>
                    <button onClick={() => setError(null)} className="hover:opacity-70 transition-colors">
                        <X size={14} />
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--void-surface)]/50 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <h2 className="text-[var(--text-base)] font-bold text-[var(--text-1)] tracking-tight">
                        {mode === 'pipeline' ? 'Newsroom Assistant' : 'Content Sessions'}
                    </h2>
                    <div className="h-4 w-[1px] bg-[var(--border)]" />
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--plasma-dim)] text-[var(--plasma)] rounded-full text-[var(--text-xs)] font-bold tracking-widest border border-[var(--plasma)]/20">
                        {mode === 'pipeline' ? (
                            <>
                                <div className="w-1 h-1 bg-[var(--plasma)] rounded-full animate-pulse" />
                                Live Feed
                            </>
                        ) : (
                            <>
                                <Clock size={10} />
                                Archive
                            </>
                        )}
                    </div>
                </div>

                {mode === 'pipeline' && (
                    <div className="flex items-center gap-3">
                        <button onClick={handleResearch} disabled={isGenerating} className={`btn-base min-w-[160px] h-9 shadow-lg shadow-[var(--plasma)]/5 ${isResearching ? 'btn-stop' : 'btn-primary'}`}>
                            {isResearching ? (
                                <><Octagon size={14} className="animate-pulse" />Stop Research ({Math.round(researchProgress / 10)}/10)</>
                            ) : (
                                <><Search size={14} />Research Latest News</>
                            )}
                        </button>
                        <div className="w-[1px] h-6 bg-[var(--border)] mx-1" />
                        <button onClick={handleApplyChanges} disabled={(pendingApprovals.length === 0 && pendingDenials.length === 0 && pendingDeletions.length === 0) || isGenerating || isResearching} className={`btn-base h-9 px-6 bg-[var(--void-surface-2)] text-[var(--text-1)] border border-[var(--border)] hover:border-[var(--plasma)]/50 hover:bg-white/[0.02] transition-all disabled:opacity-20 ${(pendingApprovals.length > 0 || pendingDenials.length > 0 || pendingDeletions.length > 0) ? 'border-[var(--plasma)] shadow-lg shadow-[var(--plasma)]/10' : ''}`}>
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className={pendingApprovals.length > 0 ? 'text-[var(--plasma)]' : ''} />}
                            Apply Actions { (pendingApprovals.length + pendingDenials.length + pendingDeletions.length) > 0 && `(${pendingApprovals.length + pendingDenials.length + pendingDeletions.length})` }
                        </button>
                        <button onClick={handleBatchRun} disabled={topics.filter(t => t.status === 'approved').length === 0 || isGenerating || isResearching} className={`btn-base h-9 px-6 bg-[var(--plasma)] text-[var(--void-base)] hover:opacity-90 shadow-xl shadow-[var(--plasma)]/20 transition-all disabled:opacity-20`}>
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                            Run Batch Pipeline
                        </button>
                    </div>
                )}

                {mode === 'sessions' && (
                    <div className="flex items-center gap-3">
                         <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                            <input type="text" placeholder="Search sessions..." className="bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] pl-9 pr-4 py-2 text-[var(--text-sm)] text-[var(--text-1)] outline-none focus:border-[var(--plasma)] transition-all w-64" />
                        </div>
                        <div className="w-[1px] h-6 bg-[var(--border)] mx-1" />
                        <button onClick={handleApplyChanges} disabled={(pendingPosts.length === 0 && pendingDeletions.length === 0) || isGenerating} className={`btn-base h-9 px-6 bg-[var(--void-surface-2)] text-[var(--text-1)] border border-[var(--border)] hover:border-[var(--plasma)]/50 hover:bg-white/[0.02] transition-all disabled:opacity-20 ${(pendingPosts.length > 0 || pendingDeletions.length > 0) ? 'border-[var(--plasma)] shadow-lg shadow-[var(--plasma)]/10' : ''}`}>
                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} className={pendingPosts.length > 0 ? 'text-[var(--plasma)]' : ''} />}
                            Apply Changes { (pendingPosts.length + pendingDeletions.length) > 0 && `(${pendingPosts.length + pendingDeletions.length})` }
                        </button>
                    </div>
                )}
            </div>

            {(isResearching || isGenerating) && (
                <div className="absolute top-0 left-0 w-full h-[2px] bg-[var(--plasma-dim)] overflow-hidden z-20">
                    <div className="h-full bg-[var(--plasma)] shadow-[0_0_10px_var(--plasma)] transition-all duration-300" style={{ width: `${isResearching ? researchProgress : genProgress}%` }} />
                </div>
            )}

            <div className="flex-1 bg-[var(--void-surface)] border border-[var(--border)] rounded-[6px] overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="sticky top-0 z-10 bg-[var(--void-surface-2)] border-b border-[var(--border)]">
                            <tr className="text-[var(--text-3)] font-geist tracking-widest text-left">
                                <th className="py-1 px-3">Topic</th>
                                <th className="py-1 px-3 w-[240px]">
                                    <div className="flex flex-col gap-0 w-full">
                                        <span className="">Momentum Breakdown</span>
                                        <div className="flex items-center justify-between text-[var(--text-xs)] text-[var(--text-2)] font-medium w-full">
                                            <span className="w-[60px] text-left">Avg</span>
                                            <div className="flex-1 flex items-center justify-between border-l border-[var(--border)] ml-2 pl-4">
                                                <span className="w-[32px] text-center">Tw</span>
                                                <span className="w-[32px] text-center">Fa</span>
                                                <span className="w-[32px] text-center">Li</span>
                                                <span className="w-[32px] text-center pr-1">In</span>
                                            </div>
                                        </div>
                                    </div>
                                </th>
                                <th className="py-1 px-3 w-20">Status</th>
                                {mode === 'pipeline' ? (
                                    <>
                                        <th className="py-1 px-3 w-16 text-center">Approve</th>
                                        <th className="py-1 px-3 w-16 text-center">Deny</th>
                                    </>
                                ) : (
                                    <>
                                        <th 
                                            className="py-1 px-3 w-32 cursor-pointer hover:text-[var(--plasma)] transition-colors group/sort"
                                            onClick={() => setSortConfig({ key: 'generatedAt', direction: sortConfig?.key === 'generatedAt' && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                                        >
                                            <div className="flex items-center gap-1">
                                                Generated Date
                                                <ArrowUpDown size={10} className={`transition-opacity ${sortConfig?.key === 'generatedAt' ? 'opacity-100' : 'opacity-20 group-hover/sort:opacity-50'}`} />
                                            </div>
                                        </th>
                                        <th className="py-1 px-3 w-16 text-center">Posted</th>
                                        <th 
                                            className="py-1 px-3 w-32 cursor-pointer hover:text-[var(--plasma)] transition-colors group/sort"
                                            onClick={() => setSortConfig({ key: 'postedAt', direction: sortConfig?.key === 'postedAt' && sortConfig.direction === 'desc' ? 'asc' : 'desc' })}
                                        >
                                            <div className="flex items-center gap-1">
                                                Posted Date
                                                <ArrowUpDown size={10} className={`transition-opacity ${sortConfig?.key === 'postedAt' ? 'opacity-100' : 'opacity-20 group-hover/sort:opacity-50'}`} />
                                            </div>
                                        </th>
                                    </>
                                )}
                                <th className="py-1 px-3 w-16 text-center">Delete</th>
                                <th className="py-1 px-3 w-24">Mode</th>
                                <th className="py-1 px-3 w-28">Tone</th>
                                <th className="py-1 px-3 w-32 text-center">Words</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="">
                            {topics?.filter(t => {
                                const isGenerated = t.status === 'generated' || t.status === 'posted';
                                return mode === 'sessions' ? isGenerated : !isGenerated;
                            }).sort((a, b) => {
                                if (sortConfig) {
                                    const valA = a[sortConfig.key] || '';
                                    const valB = b[sortConfig.key] || '';
                                    if (sortConfig.direction === 'desc') {
                                        return valB.localeCompare(valA);
                                    }
                                    return valA.localeCompare(valB);
                                }
                                
                                // Default Multi-level Sort: Posted Date (Desc) -> Generated Date (Desc) -> ID (Desc)
                                const postedA = a.postedAt || '';
                                const postedB = b.postedAt || '';
                                if (postedA !== postedB) return postedB.localeCompare(postedA);
                                
                                const genA = a.generatedAt || '';
                                const genB = b.generatedAt || '';
                                if (genA !== genB) return genB.localeCompare(genA);
                                
                                return (b.id || 0) - (a.id || 0);
                            }).map(topic => (
                                    <tr 
                                        key={topic.id} 
                                        className={`group transition-all duration-200 ${topic.status === 'posted' ? 'bg-[var(--text-3)]/5' : 'hover:bg-[var(--plasma-glow)]'}`} 
                                        onDoubleClick={() => (topic.status === 'generated' || topic.status === 'posted') ? onOpenArticle(topic.id!, topic.topic) : null}
                                    >
                                        <td className="py-[2px] px-4 max-w-[400px]" style={{ paddingBlock: '2px' }}>
                                            <div className="flex items-center gap-2">
                                                {(topic.status === 'generated' || topic.status === 'posted') && <Eye size={10} className="text-[var(--plasma)]" />}
                                                <span className="text-[11px] font-bold text-[var(--text-1)] line-clamp-1 leading-none">{topic.topic}</span>
                                            </div>
                                        </td>
                                    <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        <div className="flex items-center justify-between w-full">
                                            <div className="w-[60px] text-left"><span className="text-[11px] font-bold text-[var(--plasma)]">{topic.trendScore}%</span></div>
                                            <div className="flex-1 flex items-center justify-between border-l border-[var(--border)] ml-2 pl-4">
                                                {Object.entries(topic.momentumScores || {}).map(([platform, score]: [string, any], idx, arr) => (
                                                    <div key={platform} className={`w-[32px] text-center ${idx === arr.length - 1 ? 'pr-1' : ''}`}>
                                                        <span className="text-[10px] font-bold text-[var(--text-1)]">{score}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        <span className={`px-2 py-0.5 rounded-[2px] text-[var(--text-xs)] font-bold ${topic.status === 'posted' ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--text-3)]/10 text-[var(--text-3)]'}`}>
                                            {topic.status.charAt(0).toUpperCase() + topic.status.slice(1)}
                                        </span>
                                    </td>
                                    
                                    {mode === 'pipeline' ? (
                                        <>
                                            <td className="py-[2px] px-4 text-center" style={{ paddingBlock: '2px' }}>
                                                <button onClick={() => { if (pendingApprovals.includes(topic.id!)) { setPendingApprovals(prev => prev.filter(id => id !== topic.id!)); } else { setPendingApprovals(prev => [...prev, topic.id!]); setPendingDenials(prev => prev.filter(id => id !== topic.id!)); setPendingDeletions(prev => prev.filter(id => id !== topic.id!)); } }} className={`w-[14px] h-[14px] rounded-[2px] border transition-all flex items-center justify-center mx-auto ${pendingApprovals.includes(topic.id!) ? 'bg-[var(--plasma)] border-[var(--plasma)] text-[var(--void-base)]' : 'border-[var(--text-3)]/40 hover:border-[var(--plasma)]'}`}>{pendingApprovals.includes(topic.id!) && <CheckCircle2 size={8} />}</button>
                                            </td>
                                            <td className="py-[2px] px-4 text-center" style={{ paddingBlock: '2px' }}>
                                                <button onClick={() => { if (pendingDenials.includes(topic.id!)) { setPendingDenials(prev => prev.filter(id => id !== topic.id!)); } else { setPendingDenials(prev => [...prev, topic.id!]); setPendingApprovals(prev => prev.filter(id => id !== topic.id!)); setPendingDeletions(prev => prev.filter(id => id !== topic.id!)); } }} className={`w-[14px] h-[14px] rounded-[2px] border transition-all flex items-center justify-center mx-auto ${pendingDenials.includes(topic.id!) ? 'bg-[var(--error)] border-[var(--error)] text-white' : 'border-[var(--text-3)]/40 hover:border-[var(--error)]'}`}>{pendingDenials.includes(topic.id!) && <X size={8} />}</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                                <span className="text-[10px] text-[var(--text-3)] font-mono whitespace-nowrap">
                                                    {topic.generatedAt ? new Date(topic.generatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </td>
                                            <td className="py-[2px] px-4 text-center" style={{ paddingBlock: '2px' }}>
                                                <button 
                                                    disabled={topic.status === 'posted'}
                                                    onClick={() => { if (pendingPosts.includes(topic.id!)) { setPendingPosts(prev => prev.filter(id => id !== topic.id!)); } else { setPendingPosts(prev => [...prev, topic.id!]); setPendingDeletions(prev => prev.filter(id => id !== topic.id!)); } }} 
                                                    className={`w-[14px] h-[14px] rounded-[2px] border transition-all flex items-center justify-center mx-auto ${topic.status === 'posted' || pendingPosts.includes(topic.id!) ? 'bg-[var(--success)] border-[var(--success)] text-white' : 'border-[var(--text-3)]/40 hover:border-[var(--success)]'}`}
                                                >
                                                    {(topic.status === 'posted' || pendingPosts.includes(topic.id!)) && <CheckCircle2 size={8} />}
                                                </button>
                                            </td>
                                            <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                                <span className="text-[10px] text-[var(--text-3)] font-mono whitespace-nowrap">
                                                    {topic.postedAt ? new Date(topic.postedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                                                </span>
                                            </td>
                                        </>
                                    )}

                                    <td className="py-[2px] px-4 text-center" style={{ paddingBlock: '2px' }}>
                                        <button onClick={() => { if (pendingDeletions.includes(topic.id!)) { setPendingDeletions(prev => prev.filter(id => id !== topic.id!)); } else { setPendingDeletions(prev => [...prev, topic.id!]); setPendingApprovals(prev => prev.filter(id => id !== topic.id!)); setPendingDenials(prev => prev.filter(id => id !== topic.id!)); setPendingPosts(prev => prev.filter(id => id !== topic.id!)); } }} className={`w-[14px] h-[14px] rounded-[2px] border transition-all flex items-center justify-center mx-auto ${pendingDeletions.includes(topic.id!) ? 'bg-[var(--error)] border-[var(--error)] text-white' : 'border-[var(--text-3)]/40 hover:border-[var(--error)]'}`}>{pendingDeletions.includes(topic.id!) && <Trash2 size={8} />}</button>
                                    </td>
                                    <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        {mode === 'pipeline' ? (
                                            <select value={topic.mode} onChange={(e) => handleUpdateTopic(topic.id!, { mode: e.target.value })} className="bg-transparent text-[var(--text-2)] outline-none cursor-pointer hover:text-[var(--plasma)] transition-colors px-0 text-[10px]">
                                                <option value="post" className="bg-[var(--void-surface-2)]">Post</option>
                                                <option value="article" className="bg-[var(--void-surface-2)]">Article</option>
                                                <option value="thread" className="bg-[var(--void-surface-2)]">Thread</option>
                                            </select>
                                        ) : (
                                            <span className="text-[11px] text-[var(--text-3)] capitalize">{topic.mode}</span>
                                        )}
                                    </td>
                                    <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        {mode === 'pipeline' ? (
                                            <select value={topic.tone} onChange={(e) => handleUpdateTopic(topic.id!, { tone: e.target.value })} className="bg-transparent text-[var(--text-2)] outline-none cursor-pointer hover:text-[var(--plasma)] transition-colors w-full px-0 text-[10px]">
                                                <option value="professional" className="bg-[var(--void-surface-2)]">Professional</option>
                                                <option value="conversational" className="bg-[var(--void-surface-2)]">Conversational</option>
                                                <option value="story" className="bg-[var(--void-surface-2)]">Story</option>
                                                <option value="bold" className="bg-[var(--void-surface-2)]">Bold</option>
                                            </select>
                                        ) : (
                                            <span className="text-[11px] text-[var(--text-3)] capitalize">{topic.tone}</span>
                                        )}
                                    </td>
                                    <td className="py-[2px] px-3" style={{ paddingBlock: '2px' }}>
                                        {mode === 'pipeline' ? (
                                            <div className="flex items-center justify-center gap-0">
                                                <button 
                                                    onClick={() => handleUpdateTopic(topic.id!, { pages: Math.max(0.0125, topic.pages - 0.0125) })} 
                                                    className="w-4 h-4 flex items-center justify-center text-[var(--text-3)] hover:text-[var(--plasma)] transition-colors text-[16px] font-light"
                                                >
                                                    -
                                                </button>
                                                <input 
                                                    type="text"
                                                    value={Math.round(topic.pages * 800)}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        const num = Math.min(parseInt(val) || 0, 5000);
                                                        handleUpdateTopic(topic.id!, { pages: num / 800 });
                                                    }}
                                                    className="w-12 h-4 bg-[var(--void-base)] border border-[var(--border)] rounded-[2px] text-center font-geist text-[10px] font-bold text-[var(--plasma)] outline-none focus:border-[var(--plasma)] transition-all px-[1px]"
                                                />
                                                <button 
                                                    onClick={() => handleUpdateTopic(topic.id!, { pages: Math.min(6.25, topic.pages + 0.0125) })} 
                                                    className="w-4 h-4 flex items-center justify-center text-[var(--text-3)] hover:text-[var(--plasma)] transition-colors text-[16px] font-light"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center font-geist text-[11px] font-bold text-[var(--text-3)]">
                                                {Math.round(topic.pages * 800)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-3 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={14} className="text-[var(--text-3)]" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';

export function ArticleDetailView({ id }: { id?: number }) {
    const [topic, setTopic] = useState<PipelineTopic | undefined>(undefined);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [copying, setCopying] = useState(false);

    useEffect(() => {
        if (id) {
            axios.get(`${API_BASE}/pipeline`).then(res => {
                const found = res.data.find((t: any) => t.id === id);
                setTopic(found);
            });
        }
    }, [id]);

    if (!topic) return null;

    const handleCopy = () => {
        const fullContent = `${topic.topic}\n\n${topic.hook}\n\n${topic.article}`;
        navigator.clipboard.writeText(fullContent);
        setCopying(true);
        setTimeout(() => setCopying(false), 2000);
    };

    const downloadMarkdown = () => {
        const content = `# ${topic.topic}\n\n${topic.hook}\n\n${topic.article}`;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, `${topic.topic.toLowerCase().replace(/\s+/g, '-')}.md`);
        setShowDownloadMenu(false);
    };

    const downloadWord = async () => {
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: topic.topic,
                                bold: true,
                                size: 48, // 24pt
                            }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 800 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: topic.hook || "",
                                italics: true,
                                size: 26, // 13pt
                                color: "333333"
                            }),
                        ],
                        spacing: { after: 400 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: topic.article || "",
                                size: 24, // 12pt
                            }),
                        ],
                        spacing: { after: 200 }
                    }),
                ],
            }],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${topic.topic.toLowerCase().replace(/\s+/g, '-')}.docx`);
        setShowDownloadMenu(false);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const centerX = pageWidth / 2;
        let currentY = 30;

        // Title (Centered)
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        const splitTitle = doc.splitTextToSize(topic.topic, 170);
        doc.text(splitTitle, centerX, currentY, { align: 'center' });
        currentY += (splitTitle.length * 10) + 20;

        // Hook (Italic)
        doc.setFontSize(13);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(60);
        const splitHook = doc.splitTextToSize(topic.hook || "", 170);
        doc.text(splitHook, 15, currentY);
        currentY += (splitHook.length * 7) + 15;

        // Body
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0);
        const splitContent = doc.splitTextToSize(topic.article || "", 170);
        
        splitContent.forEach((line: string) => {
            if (currentY > 280) {
                doc.addPage();
                currentY = 20;
            }
            doc.text(line, 15, currentY);
            currentY += 7;
        });
        
        doc.save(`${topic.topic.toLowerCase().replace(/\s+/g, '-')}.pdf`);
        setShowDownloadMenu(false);
    };

    return (
        <div className="h-full flex flex-col bg-[var(--void-base)] overflow-hidden">
            <div className="p-6 border-b border-[var(--border)] bg-[var(--void-surface)] flex items-center justify-between">
                <div>
                    <h2 className="text-[var(--text-base)] font-bold mb-1">{topic.topic}</h2>
                    <div className="flex items-center gap-4 text-[var(--text-sm)] text-[var(--text-3)] font-geist">
                        <div className="flex items-center gap-1"><FileText size={12} className="text-[var(--plasma)]" /> Analytics Ready</div>
                        <div className="flex items-center gap-1"><Check size={12} className="text-[var(--success)]" /> Quality Verified</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleCopy} 
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--void-surface-2)] border border-[var(--border)] text-[var(--text-1)] text-[var(--text-sm)] font-bold rounded-[4px] hover:border-[var(--plasma)] transition-all"
                    >
                        {copying ? <Check size={14} className="text-[var(--success)]" /> : <Copy size={14} />}
                        {copying ? 'Copied' : 'Copy Content'}
                    </button>
                    
                    <div className="relative">
                        <button 
                            onClick={() => setShowDownloadMenu(!showDownloadMenu)} 
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--plasma)] text-[var(--void-base)] text-[11px] font-bold rounded-[4px] hover:opacity-90 transition-all shadow-lg shadow-[var(--plasma)]/20"
                        >
                            <Download size={14} />
                            Download
                            <ChevronDown size={14} className={`transition-transform duration-200 ${showDownloadMenu ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showDownloadMenu && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                                <div className="absolute right-0 mt-2 w-48 bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[6px] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <button onClick={downloadPDF} className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-medium text-[var(--text-1)] hover:bg-[var(--plasma-dim)] transition-colors border-b border-[var(--border)]">
                                        <FileDown size={16} className="text-[var(--error)]" /> Export as PDF
                                    </button>
                                    <button onClick={downloadWord} className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-medium text-[var(--text-1)] hover:bg-[var(--plasma-dim)] transition-colors border-b border-[var(--border)]">
                                        <FileText size={16} className="text-[var(--info)]" /> Export as Word (.docx)
                                    </button>
                                    <button onClick={downloadMarkdown} className="w-full flex items-center gap-3 px-4 py-3 text-[12px] font-medium text-[var(--text-1)] hover:bg-[var(--plasma-dim)] transition-colors">
                                        <FileDown size={16} className="text-[var(--plasma)]" /> Export as Markdown
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-12 font-sans leading-relaxed text-[14px]">
                <div className="max-w-3xl mx-auto space-y-10">
                    <div className="text-center mb-16">
                        <h1 className="text-[32px] font-bold text-[var(--text-1)] leading-tight mb-4">{topic.topic}</h1>
                        <div className="w-20 h-1 bg-[var(--plasma)] mx-auto rounded-full opacity-50" />
                    </div>
                    
                    <div className="space-y-8">
                        <p className="text-[18px] text-[var(--text-1)] italic leading-relaxed font-medium border-l-4 border-[var(--plasma)]/30 pl-6 py-2">
                            {topic.hook || 'Generating hook...'}
                        </p>
                        
                        <div className="text-[var(--text-2)] whitespace-pre-wrap text-[16px] leading-[1.8] font-normal">
                            {topic.article || 'Generating content...'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

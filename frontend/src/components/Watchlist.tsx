import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/data';

interface WatchlistItem {
    id: number;
    name: string;
    category?: string;
    marketRank?: number;
    lastUpdate?: string;
}

export default function Watchlist() {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('AI Companies');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchWatchlist = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE}/watchlist`);
            setWatchlist(response.data);
        } catch (err) {
            // Error handled via silent failure for now
        }
    }, []);

    useEffect(() => {
        fetchWatchlist();
    }, [fetchWatchlist]);

    const categories = Array.from(new Set(watchlist?.map(w => w.category || 'AI Companies') || ['AI Companies', 'IT Strategy']));
    const currentItems = watchlist?.filter(w => (w.category || 'AI Companies') === activeCategory) || [];

    const handleAddCategory = () => {
        const name = prompt("Enter new category name (e.g. Cybersecurity):");
        if (name) {
            setActiveCategory(name);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await axios.post(`${API_BASE}/watchlist/refresh`, { category: activeCategory });
            await fetchWatchlist();
        } catch (err) {
            console.error('Failed to refresh rankings:', err);
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-[var(--text-1)]">Source Watchlist</h2>
                    <p className="text-[11px] text-[var(--text-3)]">Managed priority lists for Research Bot prioritization</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 py-1.5 border border-[var(--border)] text-[var(--text-2)] text-[11px] font-bold rounded-[4px] hover:text-[var(--text-1)] hover:bg-white/[0.03] transition-all disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
                        Refresh Market Rankings
                    </button>
                    <button 
                        onClick={handleAddCategory}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--plasma-dim)] text-[var(--plasma)] text-[11px] font-bold rounded-[4px] hover:bg-[var(--plasma)] hover:text-[var(--void-base)] transition-all"
                    >
                        <Plus size={12} />
                        Add Category
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-px bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] p-0.5 mb-4 w-fit">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-1.5 rounded-[3px] text-[11px] font-bold transition-all ${activeCategory === cat ? 'bg-[var(--plasma)] text-[var(--void-base)] shadow-lg' : 'text-[var(--text-3)] hover:text-[var(--text-2)]'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Grid Table */}
            <div className="flex-1 bg-[var(--void-surface)] border border-[var(--border)] rounded-[6px] overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="sticky top-0 z-10 bg-[var(--void-surface-2)] border-b border-[var(--border)]">
                            <tr className="text-[var(--text-3)] font-geist uppercase tracking-widest">
                                <th className="p-3 w-16">Rank</th>
                                <th className="p-3">Company Name</th>
                                <th className="p-3 text-right">Last Updated</th>
                                <th className="p-3 w-20 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {currentItems.sort((a, b) => (a.marketRank || 0) - (b.marketRank || 0)).map(item => (
                                <tr key={item.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-3 text-[var(--plasma)] font-mono font-bold">#{ (item.marketRank || 0).toString().padStart(2, '0')}</td>
                                    <td className="p-3 text-[var(--text-1)] font-medium">{item.name}</td>
                                    <td className="p-3 text-right text-[var(--text-3)]">
                                        {item.lastUpdate ? new Date(item.lastUpdate).toLocaleDateString() : 'N/A'}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-center">
                                            <CheckCircle2 size={14} className="text-[var(--success)] opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {currentItems.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-10 text-center text-[var(--text-3)] font-geist italic">
                                        Initializing category data...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Advisor Banner */}
                <div className="p-3 bg-[var(--plasma-dim)]/30 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertTriangle size={14} className="text-[var(--plasma)]" />
                        <span className="text-[10px] text-[var(--text-2)] font-geist">
                            Market rankings for <strong>{activeCategory}</strong> are synced. 
                            {currentItems[0]?.lastUpdate ? ` Last Update: ${new Date(currentItems[0].lastUpdate).toLocaleString()}` : ' (No sync data)'}
                        </span>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="text-[10px] font-bold text-[var(--plasma)] hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                        Run AI Sync <ChevronRight size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
}

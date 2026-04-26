import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Search, Calendar, ExternalLink, FileText, Trash2, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api/data';

export default function Sessions() {
    const [search, setSearch] = useState('');
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSessions = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE}/pipeline`);
            // Only show posted and not deleted
            const filtered = response.data.filter((t: any) => t.status === 'posted' && !t.deletedAt);
            setSessions(filtered);
        } catch (err) {
            // Error handling
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const filtered = sessions?.filter(s => 
        s.topic.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => new Date(b.postedAt!).getTime() - new Date(a.postedAt!).getTime()) || [];

    const handleSoftDelete = async (id: number) => {
        if (confirm("Move to trash?")) {
            try {
                // Using the bulk-delete endpoint which we refactored to soft-delete
                await axios.post(`${API_BASE}/pipeline/bulk-delete`, { ids: [id] });
                fetchSessions();
            } catch (err) {
                alert("Failed to delete session.");
            }
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col gap-1">
                    <h2 className="text-[15px] font-bold text-[var(--text-1)]">Content Sessions</h2>
                    <p className="text-[11px] text-[var(--text-3)]">Archive of all published and finalized articles</p>
                </div>
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]" />
                    <input 
                        type="text"
                        placeholder="Search sessions..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] pl-9 pr-4 py-2 text-[11px] text-[var(--text-1)] outline-none focus:border-[var(--plasma)] transition-all w-64"
                    />
                </div>
            </div>

            <div className="flex-1 bg-[var(--void-surface)] border border-[var(--border)] rounded-[6px] overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="sticky top-0 z-10 bg-[var(--void-surface-2)] border-b border-[var(--border)]">
                            <tr className="text-[var(--text-3)] font-geist uppercase tracking-widest">
                                <th className="p-3">Topic</th>
                                <th className="p-3">Posted Date</th>
                                <th className="p-3">Format</th>
                                <th className="p-3 w-10 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                            {filtered.map(session => (
                                <tr key={session.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="p-3">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[var(--text-1)] font-medium">{session.topic}</span>
                                            <span className="text-[9px] text-[var(--text-3)] uppercase tracking-wider flex items-center gap-1">
                                                <Clock size={10} />
                                                Generated {new Date(session.generatedAt!).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2 text-[var(--text-2)]">
                                            <Calendar size={12} className="text-[var(--plasma)]" />
                                            {new Date(session.postedAt!).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <span className="px-2 py-0.5 rounded-[2px] bg-[var(--plasma-dim)] text-[var(--plasma)] text-[9px] font-bold uppercase">
                                            {session.mode}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex justify-center items-center gap-2">
                                            <button className="p-1.5 hover:bg-white/5 rounded text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
                                                <ExternalLink size={14} />
                                            </button>
                                            <button 
                                                onClick={() => handleSoftDelete(session.id!)}
                                                className="p-1.5 hover:bg-red-500/10 rounded text-[var(--text-3)] hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && !loading && (
                                <tr>
                                    <td colSpan={4} className="p-10 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <FileText size={32} />
                                            <p className="text-[11px] font-geist uppercase tracking-widest italic">No sessions found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

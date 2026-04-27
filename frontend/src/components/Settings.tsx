import { useState, useEffect } from 'react';
import { Palette, User, Zap, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api/data';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<'profile' | 'theme'>('profile');

    return (
        <div className="flex h-full overflow-hidden bg-[var(--void-base)]">
            {/* Settings Sidebar */}
            <div className="w-56 border-r border-[var(--border)] bg-[var(--void-surface)] flex flex-col p-4 gap-2">
                <h3 className="text-[var(--text-xs)] font-light text-[var(--text-3)] uppercase tracking-widest px-3 mb-2">Preferences</h3>
                
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[4px] text-[var(--text-sm)] font-light transition-all ${activeTab === 'profile' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)]' : 'text-[var(--text-2)] hover:bg-white/[0.03]'}`}
                >
                    <User size={14} />
                    User Identity
                </button>
                <button 
                    onClick={() => setActiveTab('theme')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[4px] text-[var(--text-sm)] font-light transition-all ${activeTab === 'theme' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)]' : 'text-[var(--text-2)] hover:bg-white/[0.03]'}`}
                >
                    <Palette size={14} />
                    Visual Theme
                </button>
                <div className="mt-auto pt-4 border-t border-[var(--border)] flex flex-col gap-2">
                    <div className="px-3 flex items-center justify-between text-[var(--text-xs)] text-[var(--text-3)] font-geist">
                        <span>Database v3.0.0</span>
                        <div className="flex items-center gap-1 text-[var(--success)]">
                            <CheckCircle2 size={10} /> Postgres Sync
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-[var(--void-base)]">
                {activeTab === 'profile' && <ProfileSettings />}
                {activeTab === 'theme' && <ThemeSettings />}
            </div>
        </div>
    );
}

function ProfileSettings() {
    const [name, setName] = useState('Ghost Writer');

    useEffect(() => {
        axios.get(`${API_BASE}/settings`).then(res => {
            if (res.data.userName) setName(res.data.userName);
        });
    }, []);

    const handleUpdateName = async (val: string) => {
        setName(val);
        await axios.patch(`${API_BASE}/settings`, { userName: val });
    };
    
    return (
        <div className="p-10 max-w-2xl">
            <h2 className="text-[var(--text-md)] font-light text-[var(--text-1)] mb-8">User Identity</h2>
            
            <div className="flex items-center gap-8 mb-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--plasma)] to-[var(--violet)] flex items-center justify-center text-[var(--text-xl)] font-light text-[var(--void-base)] shadow-2xl relative group cursor-pointer">
                    {name.charAt(0)}
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[var(--text-xs)] uppercase font-light tracking-widest">
                        Change
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[var(--text-xs)] font-light text-[var(--text-3)] uppercase tracking-widest">Display Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => handleUpdateName(e.target.value)}
                            className="bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] px-4 py-2.5 text-[var(--text-base)] text-[var(--text-1)] outline-none focus:border-[var(--plasma)] transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-[8px] bg-[var(--plasma-dim)]/10 border border-[var(--plasma)]/20">
                <div className="flex items-center gap-3 mb-2 text-[var(--plasma)]">
                    <Zap size={16} />
                    <h4 className="text-[var(--text-base)] font-light">Personalized Agent Prompting</h4>
                </div>
                <p className="text-[var(--text-sm)] text-[var(--text-3)] leading-relaxed">
                    Your identity is now stored in PostgreSQL. It is injected into every article generation request to ensure the tone and perspective match your unique writing style.
                </p>
            </div>
        </div>
    );
}

function ThemeSettings() {
    const [themeName, setThemeName] = useState('void');

    useEffect(() => {
        axios.get(`${API_BASE}/settings`).then(res => {
            if (res.data.themeName) setThemeName(res.data.themeName);
        });
    }, []);

    const themes = [
        { name: 'Plasma Void', id: 'void', base: '#020617', surface: '#0F172A', plasma: '#6366F1', text: '#F8FAFC' },
        { name: 'Atlantic Signal', id: 'atlantic', base: '#F8FAFC', surface: '#FFFFFF', plasma: '#2563EB', text: '#0F172A' },
        { name: 'Nordic Night', id: 'nordic', base: '#0F172A', surface: '#1E293B', plasma: '#38BDF8', text: '#F8FAFC' },
        { name: 'Cyber Slate', id: 'slate', base: '#111111', surface: '#1A1A1A', plasma: '#A855F7', text: '#FFFFFF' },
        { name: 'Solarized Paper', id: 'solar', base: '#FDF6E3', surface: '#EEE8D5', plasma: '#B58900', text: '#073642' },
        { name: 'Midnight Violet', id: 'violet', base: '#0B071A', surface: '#170E2D', plasma: '#A78BFA', text: '#F5F3FF' },
        { name: 'Cyber Emerald', id: 'emerald', base: '#020617', surface: '#064E3B', plasma: '#10B981', text: '#ECFDF5' },
        { name: 'Solar Flare', id: 'solar-flare', base: '#0F0000', surface: '#450A0A', plasma: '#F97316', text: '#FFF7ED' }
    ];

    const applyTheme = async (id: string) => {
        setThemeName(id);

        // Remove all theme classes first
        document.documentElement.classList.remove(
            'theme-atlantic', 'theme-nordic', 'theme-slate', 'theme-solar',
            'theme-violet', 'theme-emerald', 'theme-solar-flare', 'theme-void'
        );
        
        document.documentElement.classList.add(`theme-${id}`);
        
        await axios.patch(`${API_BASE}/settings`, { 
            themeName: id
        });
    };

    return (
        <div className="p-10 max-w-4xl">
            <div className="flex flex-col gap-1 mb-8">
                <h2 className="text-[var(--text-md)] font-light text-[var(--text-1)]">Visual Universe</h2>
                <p className="text-[var(--text-3)] text-[var(--text-sm)]">Select a curated environment for your agentic studio</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                {themes.map(t => (
                    <div 
                        key={t.id}
                        onClick={() => applyTheme(t.id)}
                        style={{ 
                            backgroundColor: t.surface,
                            borderColor: themeName === t.id ? t.plasma : 'rgba(255,255,255,0.05)',
                            boxShadow: themeName === t.id ? `0 0 20px ${t.plasma}33` : 'none'
                        }}
                        className={`group relative overflow-hidden border rounded-[12px] cursor-pointer transition-all duration-300
                            ${themeName === t.id ? 'ring-1 ring-inset' : 'hover:border-white/20'}`}
                    >
                        {/* Theme Preview Header */}
                        <div className="h-16 flex border-b border-white/5">
                            <div className="flex-1" style={{ backgroundColor: t.base }} />
                            <div className="flex-1" style={{ backgroundColor: t.surface }} />
                            <div className="flex-1 relative" style={{ backgroundColor: t.plasma }}>
                                <div className="absolute inset-0 bg-white/10" />
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex flex-col gap-1">
                                <span className="text-[var(--text-base)] font-light" style={{ color: t.text }}>{t.name}</span>
                                <div className="flex gap-1.5 items-center">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.plasma }} />
                                    <span className="text-[var(--text-xs)] uppercase tracking-widest font-light opacity-40" style={{ color: t.text }}>Accent</span>
                                </div>
                            </div>

                            {themeName === t.id && (
                                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: t.plasma, color: t.base }}>
                                    <CheckCircle2 size={14} />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

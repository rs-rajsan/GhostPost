import { useState, useEffect } from 'react';
import { Palette, User, Shield, Zap, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import Watchlist from './Watchlist';

const API_BASE = 'http://localhost:5000/api/data';

export default function Settings() {
    const [activeTab, setActiveTab] = useState<'profile' | 'watchlist' | 'theme'>('profile');

    return (
        <div className="flex h-full overflow-hidden bg-[var(--void-base)]">
            {/* Settings Sidebar */}
            <div className="w-56 border-r border-[var(--border)] bg-[var(--void-surface)] flex flex-col p-4 gap-2">
                <h3 className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest px-3 mb-2">Preferences</h3>
                
                <button 
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[4px] text-[12px] font-medium transition-all ${activeTab === 'profile' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)]' : 'text-[var(--text-2)] hover:bg-white/[0.03]'}`}
                >
                    <User size={14} />
                    User Identity
                </button>
                <button 
                    onClick={() => setActiveTab('watchlist')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[4px] text-[12px] font-medium transition-all ${activeTab === 'watchlist' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)]' : 'text-[var(--text-2)] hover:bg-white/[0.03]'}`}
                >
                    <Shield size={14} />
                    Source Watchlist
                </button>
                <button 
                    onClick={() => setActiveTab('theme')}
                    className={`flex items-center gap-3 px-3 py-2 rounded-[4px] text-[12px] font-medium transition-all ${activeTab === 'theme' ? 'bg-[var(--plasma-dim)] text-[var(--plasma)]' : 'text-[var(--text-2)] hover:bg-white/[0.03]'}`}
                >
                    <Palette size={14} />
                    Visual Theme
                </button>
                <div className="mt-auto pt-4 border-t border-[var(--border)] flex flex-col gap-2">
                    <div className="px-3 flex items-center justify-between text-[10px] text-[var(--text-3)] font-geist">
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
                {activeTab === 'watchlist' && <Watchlist />}
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
            <h2 className="text-[20px] font-bold text-[var(--text-1)] mb-8">User Identity</h2>
            
            <div className="flex items-center gap-8 mb-10">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--plasma)] to-[var(--violet)] flex items-center justify-center text-[32px] font-bold text-[var(--void-base)] shadow-2xl relative group cursor-pointer">
                    {name.charAt(0)}
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px] uppercase font-bold tracking-widest">
                        Change
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest">Display Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => handleUpdateName(e.target.value)}
                            className="bg-[var(--void-surface-2)] border border-[var(--border)] rounded-[4px] px-4 py-2.5 text-[13px] text-[var(--text-1)] outline-none focus:border-[var(--plasma)] transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-[8px] bg-[var(--plasma-dim)]/10 border border-[var(--plasma)]/20">
                <div className="flex items-center gap-3 mb-2 text-[var(--plasma)]">
                    <Zap size={16} />
                    <h4 className="text-[13px] font-bold">Personalized Agent Prompting</h4>
                </div>
                <p className="text-[11px] text-[var(--text-3)] leading-relaxed">
                    Your identity is now stored in PostgreSQL. It is injected into every article generation request to ensure the tone and perspective match your unique writing style.
                </p>
            </div>
        </div>
    );
}

function ThemeSettings() {
    const [hueValue, setHueValue] = useState('245');
    const [themeName, setThemeName] = useState('void');

    useEffect(() => {
        axios.get(`${API_BASE}/settings`).then(res => {
            if (res.data.themeHue) setHueValue(res.data.themeHue.toString());
            if (res.data.themeName) setThemeName(res.data.themeName);
        });
    }, []);

    const themes = [
        { name: 'Plasma Void', color: '245', id: 'void' },
        { name: 'Cyber Emerald', color: '150', id: 'void' },
        { name: 'Midnight Violet', color: '270', id: 'void' },
        { name: 'Solar Flare', color: '35', id: 'void' },
        { name: 'Atlantic Signal', color: '221', id: 'atlantic' },
        { name: 'Nordic Night', color: '215', id: 'nordic' },
        { name: 'Cyber Slate', color: '270', id: 'slate' },
        { name: 'Solarized Paper', color: '45', id: 'solar' },
        { name: 'Midnight Violet', color: '270', id: 'violet' },
        { name: 'Cyber Emerald', color: '150', id: 'emerald' },
        { name: 'Solar Flare', color: '35', id: 'solar-flare' }
    ];

    const applyTheme = async (hue: string, id: string = 'void') => {
        setHueValue(hue);
        setThemeName(id);

        // Remove all theme classes first
        document.documentElement.classList.remove(
            'theme-atlantic', 'theme-nordic', 'theme-slate', 'theme-solar',
            'theme-violet', 'theme-emerald', 'theme-solar-flare'
        );
        
        if (id !== 'void') {
            document.documentElement.classList.add(`theme-${id}`);
        } else {
            const hsl = `${hue} 100% 60%`;
            document.documentElement.style.setProperty('--plasma', `hsl(${hsl})`);
            document.documentElement.style.setProperty('--plasma-dim', `hsla(${hsl}, 0.1)`);
            document.documentElement.style.setProperty('--plasma-glow', `hsla(${hsl}, 0.05)`);
        }
        
        await axios.patch(`${API_BASE}/settings`, { 
            themeHue: parseInt(hue),
            themeName: id
        });
    };

    return (
        <div className="p-10 max-w-2xl">
            <h2 className="text-[20px] font-bold text-[var(--text-1)] mb-8">Visual Theme</h2>
            
            <div className="grid grid-cols-2 gap-4">
                {themes.map(t => (
                    <div 
                        key={t.name}
                        onClick={() => applyTheme(t.color, t.id)}
                        className={`p-4 bg-[var(--void-surface-2)] border rounded-[8px] cursor-pointer transition-all group 
                            ${(t.id === 'void' ? (themeName === 'void' && hueValue === t.color) : themeName === t.id) 
                                ? 'border-[var(--plasma)] shadow-lg shadow-[var(--plasma)]/10' 
                                : 'border-[var(--border)] hover:border-[var(--plasma)]/40'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.id === 'atlantic' ? '#2563EB' : `hsl(${t.color} 100% 60%)` }} />
                            <span className="text-[12px] font-medium text-[var(--text-2)] group-hover:text-[var(--text-1)]">{t.name}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex flex-col gap-4">
                <label className="text-[10px] font-bold text-[var(--text-3)] uppercase tracking-widest">Advanced HSL Calibration</label>
                <div className="flex items-center gap-4">
                    <input type="range" className="flex-1 accent-[var(--plasma)]" min="0" max="360" value={hueValue} onChange={(e) => applyTheme(e.target.value)} />
                </div>
                <p className="text-[10px] text-[var(--text-3)] italic">Adjust the global plasma hue across all components (Stored in Postgres)</p>
            </div>
        </div>
    );
}

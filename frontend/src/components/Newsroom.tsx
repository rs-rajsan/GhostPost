import React, { useState } from 'react';
import { Search, X, FileText } from 'lucide-react';
import { TopicGrid, ArticleDetailView } from './TopicIntelligence';

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
                    <TopicGrid mode="pipeline" onOpenArticle={addArticleTab} />
                ) : (
                    <ArticleDetailView id={tabs.find(t => t.id === activeTab)?.articleId} />
                )}
            </div>
        </div>
    );
}

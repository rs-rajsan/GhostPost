import { useState } from 'react';
import { TopicGrid, ArticleDetailView } from './TopicIntelligence';
import { X, LayoutGrid, FileText } from 'lucide-react';

interface Tab {
    id: string;
    title: string;
    type: 'sessions' | 'article';
    articleId?: number;
}

export default function Sessions() {
    const [tabs, setTabs] = useState<Tab[]>([
        { id: 'sessions', title: 'Archive', type: 'sessions' }
    ]);
    const [activeTabId, setActiveTabId] = useState('sessions');

    const addArticleTab = (articleId: number, topic: string) => {
        const existingTab = tabs.find(t => t.articleId === articleId);
        if (existingTab) {
            setActiveTabId(existingTab.id);
            return;
        }
        
        const newTabId = `art-${articleId}`;
        const shortTitle = topic.length > 15 ? topic.substring(0, 12) + '...' : topic;
        const newTab: Tab = {
            id: newTabId,
            title: `Art: ${shortTitle}`,
            type: 'article',
            articleId
        };
        
        setTabs([...tabs, newTab]);
        setActiveTabId(newTabId);
    };

    const closeTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation();
        const newTabs = tabs.filter(t => t.id !== tabId);
        setTabs(newTabs);
        if (activeTabId === tabId) {
            setActiveTabId('sessions');
        }
    };

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

    return (
        <div className="flex flex-col h-full bg-[var(--void-base)] overflow-hidden">
             {/* Tab Bar */}
             <div className="flex items-center gap-1 px-4 pt-2 border-b border-[var(--border)] bg-[var(--void-surface-2)]/50">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-[var(--text-sm)] font-light rounded-t-[4px] cursor-pointer transition-all border-b-2 ${
                            activeTabId === tab.id 
                            ? 'bg-[var(--void-base)] text-[var(--plasma)] border-[var(--plasma)]' 
                            : 'text-[var(--text-3)] border-transparent hover:text-[var(--text-2)] hover:bg-[var(--void-base)]/50'
                        }`}
                    >
                        {tab.type === 'sessions' ? <LayoutGrid size={12} /> : <FileText size={12} />}
                        <span>{tab.title}</span>
                        {tab.id !== 'sessions' && (
                            <button 
                                onClick={(e) => closeTab(e, tab.id)}
                                className="ml-1 p-0.5 hover:bg-[var(--error)]/10 hover:text-[var(--error)] rounded transition-colors"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                ))}
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-hidden relative bg-[var(--void-base)]">
                {activeTab.id === 'sessions' ? (
                    <TopicGrid mode="sessions" onOpenArticle={addArticleTab} />
                ) : (
                    <ArticleDetailView id={activeTab.articleId} />
                )}
            </div>
        </div>
    );
}

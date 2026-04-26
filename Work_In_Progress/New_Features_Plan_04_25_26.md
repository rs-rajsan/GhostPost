# GhostPost Content OS: Implementation Plan

## User Review Required

> [!IMPORTANT]
> **Market-Driven Research**: The Research Bot will prioritize news based strictly on the AI-determined **Market Rank** of companies in your active Watchlist tabs.
> **Dynamic Categories**: You can add new industry categories (e.g., "Cybersecurity"). Each category will live in its own tab with a dedicated Top 25 watchlist.

## Phase 1: Stabilization & Foundation
**Goal**: Resolve document export issues and prepare the data layer.

### [MODIFY] [OutputDisplay.tsx](file:///c:/Users/rajsa/Documents/AI_Projects/GhostPost/frontend/src/components/OutputDisplay.tsx)
- **Selective Lazy Generation**: Generate PDF, Word, or Markdown only on selection.

---

## Phase 2: Newsroom Workspace - Research & Multi-Tab Watchlist
**Goal**: Build the Smartsheet and the Category-Based Watchlist.

### [NEW] [Multi-Tab Source Watchlist]
- **Tabbed Interface**: 
    - Default Tabs: `AI Companies`, `IT Strategy`.
    - **Category Management**: "Add Category" button to spawn new industry-specific tabs.
- **Grid Columns**: 
    - `Market Rank` (AI-determined, 1-25).
    - `Company Name`.
    - `Last Update` (Timestamp of last sync).
- **Manual Sync**: Refresh Market Rankings per tab or globally.
- **Approval Workflow**: Review "Proposed Swaps" before updating the database.

### [NEW] [Smart Research Bot]
- **Rank-Aware Search**: Agent focuses on the top-ranked companies in your active categories to find the most impactful news.
- **Progress Tracking**: Live count (`X/10 found`) and glowing progress bar.

### [NEW] [Smartsheet Newsroom Grid]
- **Double Click (Pen Row)**: Spawns Article tab.
- **Double Click (Non-Pen Row)**: Opens the **AI Momentum Prediction Popup**.

---

## Phase 3: Batch Execution & Compact Review Tabs
**Goal**: Implement batch generation and compact Article tabs.

### [BATCH] [Orchestrator Extension]
- **Multi-Select Execution**: Generate articles for "Approved" topics in bulk.
- **Post-Generation**: Trigger the **Pen Icon** visibility.

---

## Phase 4: Lifecycle Completion & Personalization

### [MIGRATION] [Posted -> Sessions]
- **Posted Toggle**: Manual switch inside the Article Tab.
- **Cleanup**: Background job deletes flagged items older than 30 days.

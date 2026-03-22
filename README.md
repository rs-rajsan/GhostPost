# GhostPost 👻

GhostPost is an **Agentic AI** content enhancement platform. It transforms raw thoughts and web articles into high-authority, viral-ready content through a coordinated **Multi-Agent Orchestration** system.

Built with a **provider-agnostic**, **whitelabeled** architecture, GhostPost ensures elite-level content generation with built-in security guardrails and deep observability.

---

## 🚀 Key Features

- **Multi-Agent Orchestration**: A sophisticated pipeline involving specialized agents for Security, Drafting, Validation, and Refinement.
- **Self-Correcting Content Loop**: The system automatically fact-checks and polishes drafts through a reflection (Validation -> Refining) cycle.
- **Deep Research capability**: Integrated real-time web search for grounding content in current data and statistics.
- **Helicone Observability**: Native integration with self-hosted Helicone for granular request tracing, latency monitoring, and token tracking.
- **Security Guardrails**: Multi-layered security scanning (Inbound & Outbound) for PII redaction, toxicity filtering, and prompt injection protection.
- **Professional Exports**: One-click downloads as **Word (DOCX)** or **PDF** with high-premium typography.

---

## 🏗 System Architecture

GhostPost utilizes a modular, role-based architecture designed for flexibility and scalability.

```mermaid
graph TD
    subgraph Client_Layer["Client Layer (React + Vite)"]
        UI["User Interface"]
        API["API Client (RQ)"]
    end
    
    subgraph Execution_Layer["Orchestration Layer (Node.js)"]
        Orch["Agent Orchestrator"]
        SecAgent["Security Agent (Guardian)"]
        DraftAgent["Drafting Agent (Writer)"]
        AuditAgent["Validation Agent (Auditor)"]
        RefAgent["Refining Agent (Editor)"]
    end
    
    subgraph Observability_Layer["Observability (Helicone)"]
        Proxy["Valhalla Proxy"]
        Dash["Metrics Dashboard"]
    end
    
    UI --> API
    API --> Orch
    
    Orch --> SecAgent
    Orch --> DraftAgent
    Orch --> AuditAgent
    Orch --> RefAgent
    
    SecAgent & DraftAgent & AuditAgent & RefAgent -.-> Proxy
    Proxy --> Dash
```

---

## 🔀 Multi-Agent Pipeline

Every content enhancement request passes through a strictly coordinated sequence of specialized AI workers.

```mermaid
sequenceDiagram
    participant U as User
    participant O as Orchestrator
    participant S as Security Agent
    participant D as Drafting Agent
    participant V as Validation Agent
    participant R as Refining Agent

    U->>O: Enhancement Request
    O->>S: Inbound Scan
    Note right of S: PII Redaction & Prompt Guard
    S-->>O: { sanitized: "..." }
    
    O->>D: Research & Drafting
    Note right of D: Deep Web Grounding (Sonar)
    D-->>O: { draft: "...", context: "..." }
    
    O->>V: Validation Audit
    Note right of V: Hallucination Detection (Gemini)
    V-->>O: { isValid: false, scoring: 6/10, hallucinations: [...] }
    
    rect rgb(230, 240, 255)
    Note over O,R: REFLECTION LOOP
    O->>R: Content Refinement
    Note right of R: Self-Correction (OpenAI)
    R-->>O: { refined: "..." }
    end
    
    O->>S: Outbound Scan
    S-->>O: { safeContent: "..." }
    O->>U: Final Delivered Content
```

## 🕵️ Agent Handoff Trace Protocol

Every enhancement request generates a granular `trace` object for observability.

| Step | Agent | Status Token | Data Responsibility |
| :--- | :--- | :--- | :--- |
| 1 | `SecurityAgent` | `inbound_complete` | Sanitizes user input and detects injections. |
| 2 | `DraftingAgent` | `drafting_complete` | Generates research-backed content via Perplexity. |
| 3 | `ValidationAgent` | `validation_complete` | Audits for hallucinations and structural quality. |
| 4 | `RefiningAgent` | `refinement_complete` | Corrects unverified claims (if triggered by low score). |
| 5 | `SecurityAgent` | `outbound_complete` | Final safety check and PII redaction of output. |

---

## 🛠 Tech Stack

### Frontend
- **React 18 & Vite**: For high-performance UI.
- **Tailwind CSS**: Modern, premium design tokens and utilities.
- **React Query**: Robust server-side state management.
- **DOCX / JSPDF**: Professional document generation.

### Backend
- **Node.js & Express**: Specialized service-oriented architecture.
- **Multi-Agent System**: Provider-agnostic agent worker classes.
- **Standard LLM Provider**: High-performance generation.
- **Audit LLM Provider**: Fact-checking and grounding.
- **Research Engine**: Real-time web-grounded data retrieval.
- **Helicone**: Integrated observability proxy.
- **ClickHouse & PostgreSQL**: Advanced analytics and storage.

---

## 🚀 Getting Started

### 1. Configure Environment
Update `backend/.env` with your role-based API keys:
```env
SECURITY_API_KEY=...
DRAFTING_API_KEY=...
VALIDATION_API_KEY=...
```

### 2. Start Observability (Optional)
Launch the self-hosted Helicone stack:
```bash
docker-compose -f helicone-compose.yml up -d
```
Access the dashboard at `http://localhost:3000`.

### 3. Start Application
```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

---

## 🔐 Engineering Principles

1. **SOLID Architecture**: Strict separation between Agent logic (prompts/state) and Provider infrastructure (API clients).
2. **Provider Agnostic**: The system is entirely whitelabeled. Switching AI models involves zero changes to core business logic.
3. **Agentic AI Patterns**: Implements Reflection, Self-Correction, and Tool-use (Research) patterns.
4. **DRY & Modular**: Centralized prompt hub and role-based configuration.
5. **Zero-Leak Policy**: Strictly no `console.log` statements in production/UI paths for enhanced security and clean debugging.

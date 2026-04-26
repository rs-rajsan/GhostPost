# Technical Architecture - GhostPost 👻

GhostPost is built on a modular, asynchronous architecture designed for high-precision content generation and deep observability.

## 🧠 Multi-Agent Parallel Intelligence

Unlike traditional linear pipelines, GhostPost utilizes **Parallel Intelligence** during its validation and refinement phase. This reduces total latency by executing independent auditing tasks simultaneously.

```mermaid
sequenceDiagram
    participant O as Orchestrator
    participant S as Security Agent
    participant D as Drafting Agent
    participant V as Validation Agent
    participant H as Hook Agent
    participant R as Refining Agent

    O->>S: [1] Inbound Security Scan
    S-->>O: Sanitized Input
    
    O->>D: [2] Research & Drafting
    D-->>O: Raw JSON Draft
    
    Note over O,H: PARALLEL INTELLIGENCE BLOCK
    rect rgb(15, 23, 42)
    par Validation & Hook Refinement
        O->>V: [3a] Factual Validation Audit
        V-->>O: Quality Score & Hallucination Trace
    and
        O->>H: [3b] Hook Strategy Optimization
        H-->>O: Refined Attention Hooks
    end
    end

    alt Quality Score < 7
        O->>R: [4] Reflection & Self-Correction
        R-->>O: Polished Content
    end

    O->>S: [5] Outbound Security Verification
    S-->>O: Final Safe Output
```

## 🛠 Tech Stack Deep-Dive

### 1. Persistence Layer
- **PostgreSQL**: Stores the master state of all research topics, sessions, and generated articles.
- **Prisma ORM**: Located in `infrastructure/database/`, providing type-safe access to your Postgres instance.
- **ClickHouse**: Used for high-volume **Agent Handoff Traces**. Every micro-action taken by an agent is logged for long-term pattern analysis.

### 2. Observability & Tracing
- **Helicone Integration**: Every LLM request is proxied through Helicone for granular token tracking and latency monitoring.
- **Child-Logger Pattern**: Each agent uses a context-aware child logger that automatically injects the `requestId` into every log pulse, allowing for perfect "session stitching."

### 3. Resilience Patterns
- **Retry Logic**: All agent tasks use an exponential backoff retry mechanism to survive transient API failures (429/503).
- **Interruptible Streams**: Full support for `AbortController` at every layer, allowing users to physically terminate remote agent tasks instantly.

# Agent Rules: SEOKit Workspace

## Knowledge-Aware Planning Protocol
Whenever the user makes an implementation request that requires planning (Planning Mode):
1.  **Knowledge Discovery**: The agent MUST inspect the following directories to discover specifications:
    *   `SEO/architecture/`
    *   `SEO/research/`
    *   `SEO/knowledge-base/`
2.  **Prioritized Knowledge Retrieval**: The agent must prioritize reading discovered documents in the following order:
    *   **Architecture Specifications** (highest priority)
    *   **ADRs / Design Decisions**
    *   **Research Papers / Standards**
    *   **Implementation Playbooks**
    *   **Existing Source Code**
3.  **Constraint & Requirement Synthesis**: The agent must extract specific constraints and technical requirements from these retrieved documents.
4.  **Implementation Plan**: The resulting `implementation_plan.md` MUST explicitly trace how the proposed design conforms to the retrieved architectural guidelines and research findings.

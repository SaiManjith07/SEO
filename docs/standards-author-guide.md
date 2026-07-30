# SEOKit Standards Author Guide

This guide establishes the rules and conventions for creating engineering standards for the SEOKit platform.

---

## 1. Governance Model

Traceability in SEOKit enforces standard alignment from research to evidence:

```text
Research Literature / Papers
             ↓
  Engineering Standard (STD)
             ↓
     Executable Rule
             ↓
     Validator Logic
             ↓
    Compliance Evidence
```

---

## 2. Standards Documentation Template

Every standard in `SEO/knowledge-base/standards/` must follow this schema:

```markdown
---
id: STD-XX
title: [Standard Name]
level: [0 | 1 | 2]
tags: [keywords]
last_updated: YYYY-MM-DD
---

# Level [X] — [Standard Name]

### Requirements
[Specific architectural or performance requirement]

### Thresholds
*   **Error**: Limit at which page fails indexing or accessibility permanently.
*   **Warning**: Limit representing a regression warning.

### Verification Method
[Details on how a validator matches or counts this parameter]
```

---

## 3. Mapping Rules to Standards

When introducing a validator check, you must map the rule to its standard via `ExecutableRule.standard`:

```typescript
{
  id: 'geo.statistics.density',
  standard: 'STD-15', // Maps to STD-15 - Information Density
  ...
}
```

This trace code is injected into returned `EvidenceRecord` outputs, allowing post-run reporters to compile compliance compliance reports years later.

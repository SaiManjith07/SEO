# SEOKit Plugin Author Guide (v1.0.0 Stable Release)

This guide explains how to build a capability plugin for the SEOKit platform. All interfaces and schemas described here are frozen for the v1.x compatibility cycle.

---

> [!IMPORTANT]
> **Plugin Interface Freeze**: The `PlatformPlugin`, `ValidatorPlugin`, `ExecutableRule`, and `FixPlan` definitions are finalized. Third-party developers can build plugins against these structures with stability guarantees.

---

## 1. Plugin Interface Structure

All plugins must implement the `@seokit/core` `PlatformPlugin` interface:

```typescript
export interface PlatformPlugin {
  id: string; // Unique capability package namespace, e.g. 'seo'
  version: string; // Semantic version of the plugin
  engines?: {
    seokit?: string; // Semver range of required Core engine (e.g. '^1.0.0')
  };
  capabilities?: CapabilityManifest[];
  validators?: ValidatorPlugin[];
  frameworks?: FrameworkSDK[];
  rules?: ExecutableRule[];
  
  // Optional lifecycle hooks
  initialize?: (context: any) => Promise<void>;
  unload?: () => Promise<void>;
}
```

---

## 2. Implementing Lifecycles

SEOKit plugins execute stateful setup and tear down hooks.

### `initialize(context)`
*   **Purpose**: Runs during loader registration. Use this to construct database connections, allocate memory pools, or load configuration context.
*   **Rules**: Never trigger verification or write to project files here.

### `unload()`
*   **Purpose**: Runs when the loader unregisters the plugin.
*   **Rules**: Clean up all connections, empty memory tables, and reset listeners to prevent resource leaks.

---

## 3. Implementing a Validator

A validator is a stateless object executing dynamic verification checks against a target:

```typescript
export interface ValidatorPlugin {
  id: string; // Matches rule's 'validatorName'
  version: string;
  execute(plan: ExecutionPlan, context: any): Promise<VerificationEvidence>;
}
```

---

## 4. Declaring Rules

Rules describe standard validations and link them to their governing standard code:

```typescript
const exampleRule = {
  id: 'seo.canonical.exists',
  name: 'Canonical Exists',
  capabilityId: 'seo.canonical',
  severity: 'error',
  description: 'Page must declare an absolute canonical URL.',
  validatorName: 'canonical-validator',
  autoFix: true,
  version: '1.0.0',
  standard: 'STD-04' // Governing standards ID reference
};
```

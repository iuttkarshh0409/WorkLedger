# WorkLedger Session Start

**Document:** `/agent/session-start.md`
**Project:** WorkLedger
**Purpose:** Standardized implementation workflow for every Kiro development session.

---

# Session Objective

Before implementing any feature, establish a shared understanding of the current architecture, the requested work, and the implementation strategy.

Do not begin coding immediately.

Implementation follows understanding.

---

# Phase 1 — Understand the Request

Read the user's request carefully.

Determine:

* What is being built?
* What problem does it solve?
* Which existing module does it belong to?
* Is this a new feature or an enhancement?

If the request is ambiguous, ask for clarification before proceeding.

---

# Phase 2 — Load Project Context

Read the following documents in order:

```text
PROJECT_INDEX.md

↓

00_vision.md

↓

01_product_principles.md

↓

02_domain_model.md

↓

03_data_schema.md

↓

03.5_system_architecture.md

↓

Relevant feature documentation

↓

09_technical_architecture.md

↓

10_development_guidelines.md
```

Never skip documentation.

---

# Phase 3 — Confirm Understanding

Before writing code, provide a concise architectural summary.

Include:

## Feature Summary

What will be implemented?

---

## Domain Engine

Which engine owns this feature?

Examples:

* Assignment Engine
* Review Engine
* Ledger Engine
* Analytics Engine
* DNA Engine
* Timeline Engine
* Workspace Engine

---

## Documentation References

List every document that governs this implementation.

---

## Affected Modules

Identify which modules, components, services, repositories, or engines will be affected.

---

## Data Impact

Answer:

* Will new data be stored?
* Is existing data affected?
* Are derived metrics impacted?
* Does historical integrity change?

---

## Risks

Identify architectural risks before implementation begins.

---

# Phase 4 — Produce an Implementation Plan

Break the work into logical milestones.

Example:

Milestone 1

* Domain Models

Milestone 2

* Services

Milestone 3

* Repository

Milestone 4

* UI Components

Milestone 5

* Testing

Milestone 6

* Documentation

Large features should always be decomposed.

---

# Phase 5 — Wait for Approval

Do not generate production code immediately.

Present the implementation plan.

Wait for approval before proceeding.

---

# During Development

Work incrementally.

Complete one milestone at a time.

After each milestone:

* Summarize completed work.
* Highlight architectural decisions.
* Identify any deviations.
* Wait for further instruction if necessary.

---

# Documentation Validation

Before implementing any feature, verify:

* Domain terminology matches the Domain Model.
* Business rules match the documentation.
* Permissions are respected.
* Assignment lifecycle is preserved.
* Derived data is not stored.
* Existing reusable components are used where possible.

---

# Architectural Validation Checklist

Before every implementation, ask:

✓ Does this follow the documented architecture?

✓ Is business logic separated from UI?

✓ Is the Repository Pattern preserved?

✓ Is the Service Layer respected?

✓ Is historical integrity maintained?

✓ Are analytics derived instead of stored?

✓ Does this feature belong to one primary engine?

If any answer is "No", stop and revisit the implementation plan.

---

# Refactoring Rules

When refactoring:

* Preserve existing behavior.
* Improve readability.
* Reduce duplication.
* Increase modularity.

Never introduce architectural changes without approval.

---

# Error Handling

If implementation reveals an architectural conflict:

1. Stop implementation.
2. Explain the conflict.
3. Identify the affected documentation.
4. Recommend a solution.
5. Wait for approval.

Never silently invent architecture.

---

# Completion Checklist

Before marking any feature as complete, verify:

* All planned milestones are complete.
* Documentation remains accurate.
* No duplicate components were introduced.
* No undocumented business rules were added.
* Naming follows the Domain Model.
* Code remains modular.
* Existing tests still pass.
* New functionality has been validated.

---

# Communication Style

Throughout the session:

* Explain architectural decisions.
* Be transparent about trade-offs.
* Prefer clarity over speed.
* Highlight reusable opportunities.
* Recommend improvements when appropriate.

Think like an engineering partner, not just a code generator.

---

# Definition of Done

A feature is complete only when:

* The implementation matches the documented architecture.
* Business logic is correct.
* The codebase remains maintainable.
* Documentation and implementation are aligned.
* The feature is ready for future extension without significant refactoring.

---

# WorkLedger Engineering Motto

> **Understand first. Architect second. Implement third. Optimize last.**

Every session should leave the project in a better state than it was found.



# WorkLedger Documentation Index

**Document ID:** `PROJECT_INDEX.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Welcome

Welcome to the WorkLedger documentation.

This documentation serves as the **single source of truth** for the entire project.

Before implementing any feature, every contributor, coding agent, or reviewer should consult the relevant documentation.

Implementation follows documentation.

Documentation defines WorkLedger.

---

# Documentation Philosophy

The documentation is organized from **vision** to **implementation**.

Each document builds upon the previous one.

The recommended reading order should always be followed when onboarding new contributors or AI coding agents.

---

# Documentation Structure

## Phase 1 — Product Foundation

These documents define **what WorkLedger is**.

| Order | Document                      | Purpose                                          |
| ----: | ----------------------------- | ------------------------------------------------ |
|    00 | `00_vision.md`                | Product vision, mission, and long-term direction |
|    01 | `01_product_principles.md`    | Core product philosophy and engineering values   |
|    02 | `02_domain_model.md`          | Business language, entities, and relationships   |
|    03 | `03_data_schema.md`           | Canonical data structures and persistence model  |
|  03.5 | `03.5_system_architecture.md` | High-level system architecture and data flow     |

---

## Phase 2 — Business Rules

These documents define **how the product behaves**.

| Order | Document                     | Purpose                                         |
| ----: | ---------------------------- | ----------------------------------------------- |
|    04 | `04_assignment_lifecycle.md` | Assignment workflow and lifecycle               |
|  04.5 | `04.5_permission_model.md`   | Roles, permissions, and ownership               |
|    05 | `05_scoring_engine.md`       | Contributor evaluation and derived intelligence |

---

## Phase 3 — User Experience

These documents define **how the product is presented**.

| Order | Document                         | Purpose                                             |
| ----: | -------------------------------- | --------------------------------------------------- |
|    06 | `06_ui_architecture.md`          | Navigation, modules, and information architecture   |
|  06.5 | `06.5_component_architecture.md` | Component hierarchy and reusable UI building blocks |
|    07 | `07_design_system.md`            | Design philosophy and interaction principles        |

---

## Phase 4 — Engineering

These documents define **how the product is implemented**.

| Order | Document                       | Purpose                                                           |
| ----: | ------------------------------ | ----------------------------------------------------------------- |
|    08 | `08_ai_capabilities.md`        | AI philosophy, responsibilities, and future capabilities          |
|    09 | `09_technical_architecture.md` | Layered architecture and engineering structure                    |
|    10 | `10_development_guidelines.md` | Coding standards, engineering rules, and implementation practices |

---

## Phase 5 — Product Evolution

These documents define **where the product is heading**.

| Order | Document        | Purpose                                      |
| ----: | --------------- | -------------------------------------------- |
|    11 | `11_roadmap.md` | Product evolution strategy and future phases |

---

# Architecture Reading Order

Every new contributor or AI coding agent should follow this sequence.

```text
Vision
    ↓
Product Principles
    ↓
Domain Model
    ↓
Data Schema
    ↓
System Architecture
    ↓
Business Rules
    ↓
User Experience
    ↓
Technical Architecture
    ↓
Development Guidelines
    ↓
Implementation
```

Skipping documents is strongly discouraged.

---

# Architectural Principles

Every implementation must respect the following principles.

* Documentation is the source of truth.
* Structured data drives every feature.
* Historical integrity is preserved.
* Analytics are always derived.
* Business logic remains independent from UI.
* AI assists rather than decides.
* Contributor growth remains the central objective.

---

# Core Product Engines

WorkLedger is organized around independent business engines.

```text
Workspace Engine
        │
        ├── Assignment Engine
        │
        ├── Review Engine
        │
        ├── Ledger Engine
        │
        ├── Analytics Engine
        │
        ├── DNA Engine
        │
        └── Timeline Engine
```

Every new feature should belong to one primary engine.

Features spanning multiple engines should be carefully evaluated to maintain separation of responsibilities.

---

# Signature Experiences

WorkLedger is defined by three signature experiences.

## Contributor DNA

A long-term competency profile generated from historical reviews.

Purpose:

Reveal who the contributor has become.

---

## Ledger Timeline

A chronological record of every meaningful contributor activity.

Purpose:

Preserve organizational memory.

---

## Growth Journey

A visual representation of contributor evolution across assignments, milestones, and reviews.

Purpose:

Highlight continuous improvement rather than isolated performance.

These experiences differentiate WorkLedger from traditional task management systems.

---

# Version Strategy

WorkLedger evolves through intentional phases.

| Phase         | Focus                                          |
| ------------- | ---------------------------------------------- |
| Foundation    | Documentation and architecture                 |
| MVP           | Core contributor and assignment management     |
| Collaboration | Team workflows and cloud capabilities          |
| Intelligence  | AI assistance and advanced analytics           |
| Organization  | Multi-team support and enterprise capabilities |
| Platform      | APIs, plugins, and ecosystem                   |

Future development should align with this progression.

---

# Architecture Decision Records (ADR)

Major architectural decisions should be recorded separately.

Recommended structure:

```text
docs/

└── adr/

    ├── ADR-001-data-first-architecture.md
    ├── ADR-002-derived-metrics.md
    ├── ADR-003-ledger-first-history.md
    ├── ADR-004-contributor-dna.md
    └── ...
```

Each ADR should document:

* Context
* Decision
* Alternatives Considered
* Consequences

Architectural decisions should remain discoverable.

---

# For AI Coding Agents

Before generating or modifying code:

1. Read this document.
2. Read the relevant architectural documents.
3. Verify the implementation aligns with the documented principles.
4. Prefer extending existing modules over introducing new abstractions.
5. Never introduce architectural changes without corresponding documentation updates.

Implementation should reinforce the documented architecture, not redefine it.

---

# Repository Philosophy

WorkLedger is designed as a documentation-first project.

Architecture precedes implementation.

Implementation follows architecture.

Every contributor, whether human or AI, shares responsibility for preserving this relationship.

---

# Final Principle

WorkLedger is not merely software.

It is a carefully designed system for preserving the history of work, measuring growth, and strengthening collaboration.

Every document in this repository exists to support that mission.

When in doubt:

**Return to the documentation.**

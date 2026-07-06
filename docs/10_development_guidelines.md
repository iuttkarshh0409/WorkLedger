# Development Guidelines

**Document ID:** `10_development_guidelines.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Feature Version Matrix

| Guideline                | MVP |  V2 |  V3 |
| ------------------------ | :-: | :-: | :-: |
| Modular Architecture     |  ✅  |  ✅  |  ✅  |
| Clean Folder Structure   |  ✅  |  ✅  |  ✅  |
| Component Reusability    |  ✅  |  ✅  |  ✅  |
| Repository Pattern       |  ✅  |  ✅  |  ✅  |
| Service Layer            |  ✅  |  ✅  |  ✅  |
| AI Integration Standards |  ❌  |  ✅  |  ✅  |
| API Standards            |  ❌  |  ✅  |  ✅  |

---

# Purpose

This document defines the engineering standards for WorkLedger.

Every implementation should follow these guidelines to ensure consistency, maintainability, scalability, and architectural integrity.

When implementation conflicts with these guidelines, the implementation should be reconsidered.

---

# Engineering Philosophy

Write software for future contributors, not just the current developer.

Code should communicate intent before implementation.

Maintainability always takes precedence over short-term convenience.

---

# Core Engineering Rules

## Rule 1

Documentation is the source of truth.

Implementation must follow the documentation.

Never modify architecture through code alone.

Architectural changes require documentation updates first.

---

## Rule 2

Business logic belongs in Domain Engines and Services.

Never place business rules inside UI components.

Presentation components should remain presentation-only.

---

## Rule 3

Components must remain reusable.

Before creating a new component, determine whether an existing one can be reused or extended.

Avoid duplicate UI implementations.

---

## Rule 4

Never duplicate derived data.

Metrics, Contributor DNA, timelines, and analytics should always be calculated from source data.

---

## Rule 5

Keep functions focused.

One function should solve one problem.

Large functions should be decomposed into smaller responsibilities.

---

## Rule 6

Prefer explicit code over clever code.

Readable software is easier to maintain than concise software.

Optimization should never reduce clarity.

---

## Rule 7

Preserve historical integrity.

Historical records should never be silently modified or removed.

Administrative corrections should remain traceable.

---

# Folder Organization

Every directory should have a single responsibility.

Recommended structure:

```text id="mnb41k"
src/

├── app/
├── assets/
├── domain/
├── features/
├── infrastructure/
├── services/
├── shared/
├── hooks/
├── utils/
└── types/
```

Avoid feature leakage between directories.

---

# Naming Standards

Names should communicate intent.

Examples:

Good:

* AssignmentCard
* ContributorDNA
* ReviewService
* TimelineEngine

Avoid:

* DataComponent
* Helper
* Temp
* Misc
* Utils2

Generic names reduce maintainability.

---

# Component Standards

Components should:

* Have one responsibility.
* Accept clearly defined properties.
* Remain independent.
* Avoid unnecessary state.

Presentation Components should never access repositories directly.

---

# State Management

State should exist only where necessary.

Recommended order:

1. Local Component State
2. Feature State
3. Workspace State
4. Global State

Do not elevate state prematurely.

---

# Data Integrity

Never trust derived values.

Always regenerate:

* Metrics
* Contributor DNA
* Growth Journey
* Dashboard Statistics

Derived data should never become a second source of truth.

---

# Error Handling

Every failure should provide:

* Clear explanation
* Recovery path
* Consistent behavior

Avoid silent failures.

Avoid generic "Something went wrong."

---

# Logging Standards

Important events should be logged.

Examples:

* Assignment Created
* Review Published
* Permission Denied
* Repository Failure
* Data Validation Error

Logs should support debugging rather than replacing it.

---

# Documentation Standards

Every significant module should include:

* Purpose
* Responsibilities
* Public Interface
* Dependencies

Complex business rules deserve inline documentation.

Explain *why*, not *what*.

---

# Git Standards

Recommended workflow:

* One feature per branch.
* One logical change per commit.
* Meaningful commit messages.
* Pull requests should reference related documentation.

Commit history should tell the story of development.

---

# Performance Principles

Optimize after correctness.

Avoid:

* Premature optimization
* Unnecessary memoization
* Duplicate rendering
* Expensive recalculations

Measure before optimizing.

---

# Accessibility Standards

Every interface should support:

* Keyboard navigation
* Screen readers
* Semantic HTML
* Focus visibility
* Accessible labels

Accessibility is a functional requirement.

---

# Testing Philosophy

Business rules are more valuable to test than visual styling.

Testing priority:

1. Domain Engines
2. Services
3. Derived Calculations
4. Repositories
5. UI Components

Correctness precedes appearance.

---

# Code Review Checklist

Before approving any implementation:

* Does it follow the documented architecture?
* Is business logic separated from UI?
* Can existing components be reused?
* Is derived data recalculated?
* Is historical integrity preserved?
* Are names descriptive?
* Will another developer understand this in six months?

If any answer is "No," revisit the implementation.

---

# Engineering Values

WorkLedger values:

* Simplicity
* Consistency
* Readability
* Traceability
* Scalability
* Reliability
* Maintainability

Every contribution should reinforce these values.

---

# Guiding Principle

Good software is not measured by how quickly it is written.

It is measured by how confidently it can evolve.

Every line of code should make WorkLedger easier to understand, easier to extend, and easier to trust.

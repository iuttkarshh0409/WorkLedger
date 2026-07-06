# Kiro Instructions

**Document:** `/agent/kiro-instructions.md`
**Project:** WorkLedger
**Version:** 1.0.0

---

# Purpose

This document defines the expected behavior of Kiro while contributing to the WorkLedger codebase.

WorkLedger is a documentation-first project.

The architecture has been intentionally designed before implementation. Your responsibility is to faithfully implement the documented system rather than reinterpret or redesign it.

Whenever implementation conflicts with documentation, documentation takes precedence until it is intentionally revised.

---

# Your Primary Responsibilities

You are expected to:

* Build according to the documented architecture.
* Preserve consistency throughout the codebase.
* Prefer extending existing modules over creating new abstractions.
* Write maintainable, readable, and modular code.
* Keep implementation aligned with WorkLedger's long-term vision.

You are **not** expected to redesign the product during implementation.

---

# Mandatory Reading Order

Before implementing any feature, read the documentation in the following order.

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

Relevant feature documents

↓

09_technical_architecture.md

↓

10_development_guidelines.md
```

Do not skip architectural documents.

---

# Documentation is the Source of Truth

Treat documentation as authoritative.

Never:

* invent architecture
* invent terminology
* introduce undocumented business rules
* rename domain concepts

If implementation requires architectural changes:

1. Stop.
2. Explain the limitation.
3. Recommend documentation changes.
4. Wait for approval before proceeding.

---

# WorkLedger Philosophy

Always remember:

WorkLedger is **not** a task manager.

WorkLedger is a **work history and contributor intelligence platform**.

Every implementation should reinforce this philosophy.

---

# Domain Language

Always use the canonical terminology defined in the Domain Model.

Use:

* Workspace
* Contributor
* Assignment
* Submission
* Review
* Ledger
* Metrics
* Timeline
* Milestone

Avoid introducing alternative names such as:

* Employee
* User
* Ticket
* Issue
* History Log
* Evaluation
* Member

Terminology consistency is mandatory.

---

# Architectural Rules

Always preserve:

* Data-first architecture
* Layered architecture
* Repository pattern
* Service layer
* Derived metrics
* Component reusability
* Historical integrity

Business logic must never exist inside UI components.

---

# Data Rules

Treat structured data as the only source of truth.

Never manually store:

* Contributor metrics
* Dashboard statistics
* Contributor DNA
* Growth Journey data
* Timeline history
* Analytics

These must always be derived from source records.

---

# Component Guidelines

Before creating a new component:

1. Search for an existing reusable component.
2. Extend before duplicating.
3. Keep presentation separate from business logic.
4. Maintain naming consistency.
5. Preserve accessibility.

Reusable components are preferred over page-specific implementations.

---

# Business Logic

Business logic belongs in:

* Domain Engines
* Services

Never place business calculations inside:

* React Components
* Pages
* Layouts
* Hooks intended only for presentation

---

# Signature Experiences

The following experiences define WorkLedger.

Protect them carefully.

## Contributor DNA

Derived competency profile.

Never manually editable.

---

## Ledger Timeline

Chronological contributor history.

Generated from Activities.

---

## Growth Journey

Visual representation of long-term contributor growth.

Generated from historical Reviews and Metrics.

---

# Implementation Priorities

When multiple implementation options exist, prioritize:

1. Correctness
2. Simplicity
3. Readability
4. Consistency
5. Maintainability
6. Performance
7. Optimization

Avoid premature optimization.

---

# Code Quality Expectations

Generated code should be:

* Modular
* Predictable
* Self-explanatory
* Well-typed
* Easy to test
* Easy to extend

Avoid unnecessary abstraction.

Avoid deeply nested logic.

Prefer explicit code over clever code.

---

# Before Writing Code

Ask yourself:

* Which engine owns this feature?
* Which documentation governs this implementation?
* Is this derived or stored data?
* Can an existing component be reused?
* Does this preserve WorkLedger's architecture?

If the answer is unclear, revisit the documentation before implementing.

---

# During Implementation

Prefer incremental development.

Implement:

* one feature
* one module
* one responsibility

at a time.

Keep commits small and logically grouped.

---

# When Refactoring

Refactoring should improve:

* readability
* modularity
* consistency
* maintainability

Refactoring must never silently change business behavior.

---

# Error Handling

Every failure should:

* explain what happened
* preserve data integrity
* avoid silent failures
* remain predictable

Errors should help developers diagnose problems.

---

# AI Features

AI is an enhancement layer.

AI must never:

* determine official scores
* modify contributor history
* overwrite reviews
* change derived metrics
* become the source of truth

AI assists.

Humans decide.

---

# If You Are Unsure

Do not guess.

Instead:

* explain the ambiguity
* identify the conflicting documentation
* propose one or more implementation options
* recommend the safest approach

Preserving architectural integrity is more important than completing implementation quickly.

---

# Definition of Success

A successful implementation is one that:

* follows the documentation
* remains architecturally consistent
* preserves historical integrity
* keeps modules loosely coupled
* remains easy for future contributors to understand

---

# Final Instruction

Every contribution should make WorkLedger easier to understand, easier to extend, and easier to trust.

Build deliberately.

Prefer engineering over shortcuts.

When uncertain, return to the documentation.

# Technical Architecture

**Document ID:** `09_technical_architecture.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Feature Version Matrix

| Architecture Capability | MVP |  V2 |  V3 |
| ----------------------- | :-: | :-: | :-: |
| Local JSON Data         |  ✅  |  ❌  |  ❌  |
| Repository Pattern      |  ✅  |  ✅  |  ✅  |
| Service Layer           |  ✅  |  ✅  |  ✅  |
| React Application       |  ✅  |  ✅  |  ✅  |
| Local Persistence       |  ✅  |  ✅  |  ❌  |
| Backend API             |  ❌  |  ✅  |  ✅  |
| Authentication          |  ❌  |  ✅  |  ✅  |
| Cloud Database          |  ❌  |  ✅  |  ✅  |
| Real-Time Updates       |  ❌  |  ❌  |  ✅  |
| Public REST API         |  ❌  |  ❌  |  ✅  |

---

# Purpose

This document defines the technical architecture of WorkLedger.

It establishes engineering boundaries, module responsibilities, dependency flow, and implementation principles.

The architecture is intentionally technology-agnostic wherever possible.

---

# Architecture Philosophy

WorkLedger follows a layered architecture.

Each layer has one responsibility.

Dependencies always point inward.

Business logic remains independent from frameworks and infrastructure.

---

# Layer Overview

```text
Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer
```

---

# Presentation Layer

Responsible for:

* UI Components
* Pages
* Routing
* Layout
* User Interaction

Examples:

* Dashboard
* Assignment Page
* Contributor Profile
* Review Screen

This layer never performs business calculations.

---

# Application Layer

Coordinates user workflows.

Responsibilities include:

* Creating Assignments
* Publishing Reviews
* Uploading Submissions
* Managing Milestones

The Application Layer orchestrates domain services.

It contains no persistence logic.

---

# Domain Layer

The heart of WorkLedger.

Contains:

* Entities
* Business Rules
* Derived Metrics
* Validation
* Scoring Engine
* Contributor DNA Engine
* Timeline Engine

The Domain Layer should remain completely independent of React, APIs, or databases.

---

# Infrastructure Layer

Responsible for technical implementation.

Examples:

* JSON Repository
* Database Repository
* Authentication
* File Storage
* AI Provider
* External Integrations

Infrastructure may evolve without affecting business logic.

---

# Dependency Rule

```text
Presentation

↓

Application

↓

Domain

↓

Infrastructure
```

Dependencies never flow upward.

The Domain Layer must never import infrastructure-specific code.

---

# Module Organization

```text
src/

├── app/
├── domain/
├── infrastructure/
├── features/
├── shared/
├── services/
├── assets/
└── docs/
```

Each directory should have a single responsibility.

---

# Domain Modules

The Domain Layer is organized into independent engines.

```text
Assignment Engine

Review Engine

Ledger Engine

Analytics Engine

DNA Engine

Timeline Engine

Workspace Engine
```

Each engine owns its business rules.

---

# Repository Pattern

Data access should occur through repositories.

Examples:

Contributor Repository

Assignment Repository

Review Repository

Activity Repository

Milestone Repository

The rest of the application should not know where data is stored.

---

# Service Pattern

Business operations belong in services.

Examples:

Assignment Service

Review Service

Analytics Service

Contributor Service

Timeline Service

DNA Service

Services coordinate business logic.

Repositories provide persistence.

---

# State Management

Application state should remain predictable.

State categories:

* UI State
* Workspace State
* Domain State
* Derived State

Derived State should never be duplicated.

---

# Data Flow

```text
User

↓

UI

↓

Application Service

↓

Domain Engine

↓

Repository

↓

Storage

↓

Repository

↓

Domain

↓

UI
```

The flow remains consistent throughout the application.

---

# Error Handling

Errors should be categorized as:

* Validation Errors
* Domain Errors
* Infrastructure Errors
* Network Errors (Future)

Each category should provide consistent user feedback.

---

# Logging

Important events should be logged.

Examples:

* Assignment Created
* Review Published
* Workspace Created
* Permission Denied
* Repository Failure

Logging should support debugging without exposing sensitive information.

---

# Testing Strategy

Testing should prioritize business correctness.

Recommended testing order:

1. Domain Engines
2. Services
3. Repositories
4. UI Components

Business rules deserve the highest confidence.

---

# Scalability Strategy

The architecture should evolve without major refactoring.

Migration path:

Version 1

JSON Repository

↓

Version 2

Backend API

↓

Cloud Database

↓

Authentication

↓

Integrations

↓

Version 3

Real-Time Collaboration

↓

Public API

↓

Plugin Ecosystem

The architecture should support this evolution naturally.

---

# Technical Principles

1. Keep business logic framework-independent.
2. Prefer composition over inheritance.
3. Avoid duplicated state.
4. Derive rather than store.
5. Favor readability over clever abstractions.
6. Keep modules loosely coupled.
7. Optimize only after correctness.

---

# Closing Principle

WorkLedger should remain easy to evolve.

Technologies will change.

Frameworks will change.

Infrastructure will change.

A well-designed architecture should not.

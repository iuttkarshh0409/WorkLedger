# UI Architecture

**Document ID:** `06_ui_architecture.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Purpose

This document defines the user interface architecture of WorkLedger.

Rather than describing visual styling, this document specifies the application's structural layout, navigation hierarchy, and information organization.

Every screen should reflect the domain model established by previous documentation.

---

# UI Philosophy

The interface exists to expose the Ledger.

Users should never wonder:

* Where information is stored.
* Where work belongs.
* What happens next.

Navigation should mirror the natural workflow of managing delegated work.

---

# Information Hierarchy

```text
Workspace
│
├── Dashboard
├── Contributors
├── Milestones
├── Assignments
├── Reviews
├── Activity
├── Analytics
└── Settings
```

Every feature belongs to one of these modules.

---

# Primary Navigation

The application should use a persistent sidebar.

Primary navigation includes:

* Dashboard
* Contributors
* Milestones
* Assignments
* Reviews
* Activity
* Analytics
* Settings

Navigation remains consistent throughout the Workspace.

---

# Dashboard

The Dashboard is the Workspace overview.

It answers:

* What requires attention today?
* Which Assignments are overdue?
* Which Reviews are pending?
* What changed recently?
* How healthy is the Workspace?

The Dashboard should prioritize action over statistics.

---

# Contributors

Displays all Contributors within the Workspace.

Each Contributor card includes:

* Avatar
* Name
* Role
* Current Status
* Active Assignments
* Overall Score
* Last Activity

Selecting a Contributor opens their dedicated profile.

---

# Contributor Profile

The Contributor Profile serves as the central record of an individual's work history.

Sections include:

## Overview

* Profile
* Overall Score
* Contributor DNA *(Future)*
* Current Workload
* Recent Activity

---

## Assignments

Displays:

* Active Assignments
* Completed Assignments
* Archived Assignments

---

## Reviews

Chronological review history.

---

## Metrics

Automatically generated statistics.

---

## Timeline

Complete activity history.

---

## Ledger

Permanent contribution record.

---

# Milestones

Displays all project milestones.

Each Milestone contains:

* Progress
* Assignments
* Contributors
* Completion Percentage
* Pending Reviews

Milestones group related work rather than replacing Assignments.

---

# Assignments

The Assignment module displays every Assignment in the Workspace.

Each Assignment card includes:

* Title
* Contributor
* Milestone
* Priority
* Status
* Deadline
* Reviewer

Assignments may be filtered by:

* Status
* Priority
* Contributor
* Milestone
* Reviewer

---

# Assignment Detail

The Assignment Detail page contains:

## Assignment Information

---

## Submission History

---

## Reviews

---

## Activity Timeline

---

## Attachments

---

## Metadata

Everything related to an Assignment should exist on this page.

---

# Reviews

Displays all published Reviews.

Users may:

* Search
* Filter
* Sort

Selecting a Review opens its complete evaluation.

---

# Activity

The Activity module is the Workspace's chronological history.

Examples:

* Assignment Created
* Submission Uploaded
* Review Published
* Contributor Joined
* Milestone Completed

Activity should be searchable and filterable.

---

# Analytics

The Analytics module provides derived insights.

Examples include:

Workspace

* Completion Rate
* Average Score
* Pending Reviews

Contributor

* Performance Trends
* Growth
* Strength Distribution

Milestone

* Progress
* Assignment Distribution

Analytics should never contain manually entered values.

---

# Settings

Workspace configuration.

Includes:

* General Settings
* Member Management
* Roles
* Permissions
* Integrations (Future)
* Data Export
* Archive Management

---

# Global Search

The application should provide universal search.

Users should be able to search:

* Contributors
* Assignments
* Reviews
* Milestones

Search should return direct navigation to matching records.

---

# Notifications (Future)

Future notification types include:

* Assignment Assigned
* Deadline Reminder
* Review Published
* Revision Requested
* Milestone Completed

Notifications should always originate from Activities.

---

# Empty States

Every module should provide meaningful empty states.

Example:

"No Assignments yet.

Create your first Assignment to begin building your Workspace Ledger."

Empty states should educate rather than simply indicate missing data.

---

# Responsive Principles

The application should remain fully usable on:

* Desktop
* Tablet
* Mobile

The information architecture must remain consistent across devices.

Only layout changes.

Navigation logic does not.

---

# Navigation Principles

1. One Workspace is always active.
2. Every page has a single primary purpose.
3. Navigation should never exceed three levels of depth.
4. Users should always know where they are.
5. Every screen should provide a clear path back to the Dashboard.

---

# UI Principles

The interface should feel:

* Calm
* Structured
* Predictable
* Information-rich
* Action-oriented

Visual complexity should never exceed information complexity.

---

# Closing Principle

The WorkLedger interface is not a collection of pages.

It is a window into the evolving history of a Workspace, where every screen reveals another perspective of the same structured source of truth.

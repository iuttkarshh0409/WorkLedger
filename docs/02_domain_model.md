# Domain Model

**Document ID:** `02_domain_model.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Purpose

This document defines the official business language of WorkLedger.

Every feature, UI component, API endpoint, database schema, and documentation page must use the terminology defined here.

A consistent domain language improves communication, reduces ambiguity, and ensures that every part of the system describes the same concepts in the same way.

---

# Core Philosophy

WorkLedger models the history of work, not simply the completion of tasks.

Every entity exists to answer three questions:

* Who performed the work?
* What work was performed?
* How did that work contribute to long-term growth?

---

# Core Entities

---

## Workspace

A Workspace represents an independent environment where contributors collaborate.

Examples include:

* Startup Team
* College Project
* Open Source Community
* Student Club
* Freelance Team
* Company Department

A Workspace owns every other entity.

---

## Contributor

A Contributor is any individual who performs work inside a Workspace.

A Contributor may be:

* Intern
* Employee
* Freelancer
* Student
* Volunteer
* Team Member
* Open Source Contributor

A Contributor is intentionally role-neutral.

---

## Reviewer

A Reviewer evaluates completed work.

A Reviewer is responsible for:

* Assigning work
* Reviewing submissions
* Providing structured feedback
* Evaluating contributor growth

A Reviewer is a role, not a separate entity.

Any Contributor may become a Reviewer depending on permissions.

---

## Assignment

An Assignment represents a unit of delegated work.

Examples:

* Build Authentication
* Research OAuth
* Design Landing Page
* Prepare Documentation
* Create Presentation
* Fix Bug
* Write Tests

Assignments are immutable historical records.

Once created, an Assignment always remains part of the Ledger.

---

## Submission

A Submission represents a Contributor's response to an Assignment.

A Submission may contain:

* GitHub Repository
* Pull Request
* Google Document
* Drive Folder
* Presentation
* Video Demo
* Notes

Assignments may receive multiple Submissions when revisions are requested.

---

## Review

A Review is the structured evaluation of a Submission.

Reviews include:

* Scores
* Written Feedback
* Improvement Areas
* Strength Recognition
* Recommendations

Reviews are permanent historical records.

---

## Ledger

The Ledger is the complete historical record of all contributor activity.

It includes:

* Assignments
* Status Changes
* Reviews
* Feedback
* Deadlines
* Submissions
* Milestones

Nothing important should exist outside the Ledger.

---

## Metrics

Metrics are calculated values generated automatically from Ledger data.

Examples:

* Average Review Score
* Completion Rate
* On-Time Delivery
* Revision Count
* Communication Score
* Contribution Streak

Metrics are derived.

They should never be manually edited.

---

## Timeline

The Timeline is the chronological view of every significant event related to a Contributor or Assignment.

Examples:

Assignment Created

↓

Accepted

↓

Started

↓

Submitted

↓

Reviewed

↓

Completed

The Timeline provides historical context.

---

## Feedback

Feedback is qualitative guidance provided by a Reviewer.

Feedback focuses on:

* Recognition
* Improvement
* Learning
* Growth

Feedback should always remain attached to its Review.

---

## Activity

An Activity is any meaningful action performed within a Workspace.

Examples include:

* Assignment Created
* Assignment Updated
* Submission Uploaded
* Review Published
* Deadline Modified

Activities power timelines and audit history.

---

# Domain Relationships

Workspace

↓

contains

↓

Contributor

↓

receives

↓

Assignment

↓

produces

↓

Submission

↓

receives

↓

Review

↓

generates

↓

Metrics

↓

displayed through

↓

Dashboard

---

# Entity Ownership

| Entity      | Owner       |
| ----------- | ----------- |
| Workspace   | System      |
| Contributor | Workspace   |
| Assignment  | Contributor |
| Submission  | Assignment  |
| Review      | Submission  |
| Timeline    | System      |
| Metrics     | System      |
| Ledger      | System      |

---

# Canonical Vocabulary

The following terminology must always be used throughout WorkLedger.

| Preferred   | Avoid        |
| ----------- | ------------ |
| Workspace   | Project      |
| Contributor | User         |
| Contributor | Employee     |
| Contributor | Intern       |
| Contributor | Member       |
| Assignment  | Task         |
| Assignment  | Ticket       |
| Reviewer    | Manager      |
| Reviewer    | Mentor       |
| Submission  | Solution     |
| Review      | Evaluation   |
| Ledger      | History      |
| Metrics     | Statistics   |
| Timeline    | Activity Log |

Consistency is more important than familiarity.

---

# Business Rules

## Rule 1

Every Assignment belongs to exactly one Contributor.

---

## Rule 2

Every Submission belongs to exactly one Assignment.

---

## Rule 3

Every Review belongs to exactly one Submission.

---

## Rule 4

Metrics are always calculated.

They must never be directly edited.

---

## Rule 5

Deleting historical records should be strongly discouraged.

WorkLedger values traceability over convenience.

---

## Rule 6

Every significant action generates an Activity.

---

## Rule 7

Every completed Assignment contributes to the Contributor's Ledger.

---

# Identity Statement

WorkLedger is built around Contributors.

Assignments measure work.

Reviews measure quality.

Metrics measure growth.

The Ledger preserves everything.

Together, they create an enduring record of contribution and continuous improvement.

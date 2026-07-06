# Assignment Lifecycle

**Document ID:** `04_assignment_lifecycle.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Purpose

This document defines the lifecycle of an Assignment within WorkLedger.

It establishes the valid states, allowed transitions, business rules, and system behaviors associated with delegated work.

Every Assignment must progress through this lifecycle in a predictable and auditable manner.

---

# Philosophy

Assignments are not simply completed.

They evolve through a series of well-defined stages.

Each transition represents a meaningful event that contributes to the Contributor's Ledger.

Every transition creates history.

---

# Lifecycle Overview

```text
Draft
   │
   ▼
Assigned
   │
   ▼
Accepted
   │
   ▼
In Progress
   │
   ▼
Submitted
   │
   ▼
Under Review
   ├──────────────┐
   ▼              │
Completed         │
                  │
Revision Requested
        │
        ▼
Resubmitted
        │
        ▼
Under Review
```

Completed Assignments may later be archived, but they are never removed from history.

---

# State Definitions

## Draft

The Assignment has been created but has not yet been assigned.

The Contributor cannot view or interact with it.

---

## Assigned

The Assignment has been officially assigned.

The Contributor is notified and can review its details.

No work has started yet.

---

## Accepted

The Contributor has acknowledged responsibility for the Assignment.

Acceptance indicates commitment but not progress.

---

## In Progress

The Contributor has actively begun working.

This state remains until a Submission is made.

---

## Submitted

The Contributor has delivered work for review.

Editing is temporarily locked until the Reviewer responds.

---

## Under Review

The Reviewer is evaluating the latest Submission.

No new Submission may be uploaded while the Assignment is in this state.

---

## Revision Requested

The Reviewer requires improvements.

Feedback becomes available.

Revision count increases automatically.

---

## Resubmitted

The Contributor submits an updated version after addressing review feedback.

The Assignment immediately returns to the review process.

---

## Completed

The Reviewer approves the Submission.

Final Review is published.

Metrics are recalculated.

The Assignment becomes part of the Contributor's permanent performance history.

---

## Archived

The Assignment is preserved for historical purposes.

No further modifications are permitted except administrative corrections.

---

# Allowed State Transitions

| Current State      | Allowed Next States           |
| ------------------ | ----------------------------- |
| Draft              | Assigned                      |
| Assigned           | Accepted                      |
| Accepted           | In Progress                   |
| In Progress        | Submitted                     |
| Submitted          | Under Review                  |
| Under Review       | Completed, Revision Requested |
| Revision Requested | Resubmitted                   |
| Resubmitted        | Under Review                  |
| Completed          | Archived                      |

Any other transition is invalid.

---

# Automatic System Actions

## Assignment Created

The system:

* Creates Assignment
* Generates Activity
* Stores creation timestamp

---

## Assignment Assigned

The system:

* Updates status
* Generates Activity
* Records assigned date
* Sends notification (future version)

---

## Assignment Accepted

The system:

* Records acceptance timestamp
* Generates Activity

---

## Submission Uploaded

The system:

* Creates Submission
* Updates Assignment status
* Generates Activity

---

## Review Published

The system:

* Creates Review
* Calculates overall score
* Updates Contributor Metrics
* Generates Activity

---

## Revision Requested

The system:

* Increments revision count
* Stores review feedback
* Generates Activity

---

## Assignment Completed

The system:

* Finalizes Review
* Recalculates metrics
* Updates milestone progress
* Generates completion Activity

---

# Business Rules

## Rule 1

An Assignment always belongs to exactly one Contributor.

---

## Rule 2

Only one active Submission can be under review at a time.

---

## Rule 3

Every completed Assignment must have at least one Review.

---

## Rule 4

Every Review must reference exactly one Submission.

---

## Rule 5

Every transition generates an Activity.

No meaningful change occurs silently.

---

## Rule 6

Completed Assignments are immutable.

Only administrators may perform corrections.

---

## Rule 7

Revision history is permanent.

Previous Submissions remain accessible for audit purposes.

---

# Activity Timeline Example

```text
08 Jul 2026
Assignment Created

↓

08 Jul 2026
Assigned to Rolly

↓

09 Jul 2026
Accepted

↓

10 Jul 2026
Work Started

↓

13 Jul 2026
Submission Uploaded

↓

14 Jul 2026
Revision Requested

↓

16 Jul 2026
Resubmitted

↓

17 Jul 2026
Approved

↓

17 Jul 2026
Completed
```

Every event contributes to the Contributor's Ledger.

---

# Metric Effects

Each transition may affect derived metrics.

| Transition         | Metric Impact                           |
| ------------------ | --------------------------------------- |
| Assigned           | Active Assignment Count                 |
| Submitted          | Pending Reviews                         |
| Revision Requested | Revision Count                          |
| Completed          | Completion Rate, Average Score, Streaks |
| Archived           | No metric impact                        |

Derived metrics must always be recalculated rather than manually updated.

---

# Failure Scenarios

The system should prevent:

* Completing without a Submission
* Reviewing without a Submission
* Multiple active Reviews
* Invalid state transitions
* Deleting historical Assignments
* Skipping required workflow stages

These are considered integrity violations.

---

# Future Extensions

The lifecycle supports future enhancements such as:

* Assignment rejection before acceptance
* Pause / resume work
* Reviewer reassignment
* Multi-reviewer workflows
* Approval chains
* Escalation paths
* Automatic overdue handling

These features should extend the lifecycle without breaking existing transitions.

---

# Closing Principle

An Assignment is more than a task.

It is a structured journey from delegation to completion.

Every stage contributes to accountability.

Every transition creates history.

Every completed Assignment strengthens the WorkLedger.

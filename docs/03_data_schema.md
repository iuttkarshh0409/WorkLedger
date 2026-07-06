# Data Schema

**Document ID:** `03_data_schema.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Purpose

This document defines the canonical data model for WorkLedger.

Every UI component, API endpoint, automation, and analytics module must derive its data from the schema described here.

Version 1 stores data in structured JSON.

Future versions may migrate to a database without requiring changes to the domain model.

---

# Design Principles

The schema follows these principles:

* Normalize where practical.
* Avoid duplicate data.
* Store facts, derive insights.
* Prefer immutable historical records.
* Keep entities independent.
* Make future database migration seamless.

---

# Entity Relationship

```
Workspace
│
├── Contributors
│
├── Milestones
│
└── Assignments
        │
        ├── Submission(s)
        │
        ├── Review
        │
        └── Activity Timeline
```

---

# Workspace Schema

```json
{
  "id": "",
  "name": "",
  "description": "",
  "createdAt": "",
  "updatedAt": "",
  "ownerId": "",
  "status": "active"
}
```

---

# Contributor Schema

```json
{
  "id": "",
  "workspaceId": "",
  "name": "",
  "email": "",
  "avatar": "",
  "role": "Contributor",
  "joinedAt": "",
  "status": "active"
}
```

---

# Milestone Schema

```json
{
  "id": "",
  "workspaceId": "",
  "title": "",
  "description": "",
  "startDate": "",
  "deadline": "",
  "status": "planned"
}
```

---

# Assignment Schema

```json
{
  "id": "",
  "workspaceId": "",
  "milestoneId": "",
  "contributorId": "",
  "reviewerId": "",

  "title": "",
  "description": "",

  "priority": "Medium",

  "tags": [],

  "assignedOn": "",
  "deadline": "",

  "status": "Assigned",

  "revisionCount": 0,

  "createdAt": "",
  "updatedAt": ""
}
```

---

# Submission Schema

```json
{
  "id": "",
  "assignmentId": "",

  "submittedOn": "",

  "description": "",

  "attachments": [

  ],

  "githubRepository": "",

  "pullRequest": "",

  "demoLink": "",

  "notes": ""
}
```

---

# Attachment Schema

```json
{
  "id": "",
  "name": "",
  "type": "",
  "url": ""
}
```

---

# Review Schema

```json
{
  "id": "",
  "assignmentId": "",
  "submissionId": "",

  "reviewedBy": "",

  "reviewedOn": "",

  "scores": {

    "technicalQuality": 0,

    "documentation": 0,

    "communication": 0,

    "ownership": 0,

    "problemSolving": 0,

    "timeliness": 0

  },

  "overallScore": 0,

  "strengths": [

  ],

  "improvements": [

  ],

  "feedback": ""
}
```

---

# Activity Schema

Every significant event creates an activity.

```json
{
  "id": "",

  "workspaceId": "",

  "assignmentId": "",

  "contributorId": "",

  "type": "",

  "performedBy": "",

  "timestamp": "",

  "metadata": {

  }
}
```

Examples of activity types include:

* Assignment Created
* Assignment Updated
* Assignment Accepted
* Submission Uploaded
* Review Published
* Deadline Changed
* Assignment Completed

---

# Derived Metrics

The following values are never stored.

They are calculated dynamically.

Contributor Metrics

* Total Assignments
* Active Assignments
* Completed Assignments
* Completion Rate
* Average Review Score
* Average Technical Quality
* Average Documentation
* Average Communication
* Average Ownership
* Average Problem Solving
* Average Timeliness
* Total Revisions
* On-Time Completion Rate
* Average Submission Delay
* Current Contribution Streak
* Longest Contribution Streak

Workspace Metrics

* Total Contributors
* Active Contributors
* Total Assignments
* Assignments Completed
* Average Workspace Score
* Completion Rate
* Milestone Progress

Milestone Metrics

* Assignment Count
* Completion Percentage
* Average Review Score
* Pending Reviews
* Overdue Assignments

---

# Status Enumeration

Assignments may only exist in one of the following states:

```
Draft

↓

Assigned

↓

Accepted

↓

In Progress

↓

Submitted

↓

Under Review

↓

Revision Requested

↓

Resubmitted

↓

Completed

↓

Archived
```

No custom statuses should be introduced without updating the domain model.

---

# Priority Enumeration

```
Low

Medium

High

Critical
```

---

# Contributor Status

```
Active

Inactive

Archived
```

---

# Milestone Status

```
Planned

Active

Completed

Archived
```

---

# Review Scale

Every scoring category follows a standardized ten-point scale.

```
0 - Not Evaluated

1–2 Poor

3–4 Needs Improvement

5–6 Satisfactory

7–8 Good

9–10 Exceptional
```

---

# Data Integrity Rules

1. IDs must be globally unique.
2. Every Assignment references one Contributor.
3. Every Submission references one Assignment.
4. Every Review references one Submission.
5. Every Activity references at least one entity.
6. Derived metrics must never be persisted.
7. Historical records should remain immutable after completion except for administrative corrections.

---

# Future Extensions

The schema is intentionally designed to support:

* Organizations
* Teams
* Departments
* Custom Roles
* Labels
* Templates
* Recurring Assignments
* GitHub Integration
* Google Drive Integration
* Google Docs Integration
* Calendar Integration
* Notifications
* REST API
* GraphQL API
* AI Recommendation Engine

No breaking changes should be required to support these capabilities.

---

# Closing Principle

Every record stored in WorkLedger represents an objective fact.

Everything else, including dashboards, analytics, reports, timelines, and insights, should be generated from these facts.

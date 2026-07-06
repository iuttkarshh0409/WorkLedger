# Scoring Engine

**Document ID:** `05_scoring_engine.md`
**Project:** WorkLedger
**Version:** 1.0.0
**Status:** Approved
**Owner:** Gaurav
**Last Updated:** July 6, 2026

---

# Purpose

This document defines how WorkLedger evaluates completed assignments and transforms reviews into measurable contributor insights.

The Scoring Engine provides a standardized, fair, and transparent framework for assessing work quality while preserving historical accuracy.

Scores exist to support growth, not competition.

---

# Philosophy

WorkLedger measures contribution across multiple dimensions.

A single number cannot accurately represent a person's performance.

Instead, every Review evaluates several independent competencies.

These measurements collectively describe a Contributor's strengths, weaknesses, and growth over time.

---

# Evaluation Categories

Every completed Assignment should be evaluated using the following categories.

---

## Technical Quality

Measures:

* Correctness
* Code quality
* Solution design
* Maintainability
* Testing

Question:

> Was the work technically sound?

---

## Documentation

Measures:

* Clarity
* Completeness
* Readability
* Structure

Question:

> Could another contributor continue this work?

---

## Communication

Measures:

* Responsiveness
* Updates
* Clarification
* Collaboration

Question:

> Did the Contributor communicate effectively?

---

## Ownership

Measures:

* Initiative
* Responsibility
* Independence
* Reliability

Question:

> Did the Contributor take ownership of the assignment?

---

## Problem Solving

Measures:

* Analysis
* Creativity
* Decision making
* Debugging approach

Question:

> How effectively were obstacles resolved?

---

## Timeliness

Measures:

* Deadline adherence
* Planning
* Delivery consistency

Question:

> Was the work delivered when expected?

---

# Score Scale

Each category follows the same ten-point scale.

| Score | Meaning           |
| ----- | ----------------- |
| 0     | Not Evaluated     |
| 1-2   | Poor              |
| 3-4   | Needs Improvement |
| 5-6   | Satisfactory      |
| 7-8   | Good              |
| 9-10  | Exceptional       |

Consistency across Reviewers is more important than precision.

---

# Overall Review Score

The Overall Review Score is calculated automatically.

By default, every category contributes equally.

```text
Overall Score =
Average of all evaluated categories
```

Future versions may introduce configurable weighting.

---

# Contributor Metrics

Individual Review scores accumulate into Contributor Metrics.

The system automatically calculates:

* Average Overall Score
* Average Technical Quality
* Average Documentation
* Average Communication
* Average Ownership
* Average Problem Solving
* Average Timeliness

These metrics are recalculated whenever a Review is published.

---

# Performance Indicators

In addition to scores, the system measures behavioral indicators.

These include:

* Assignments Completed
* Active Assignments
* Completion Rate
* On-Time Completion Rate
* Revision Count
* Average Review Duration
* Average Submission Delay
* Contribution Streak
* Longest Streak

These indicators describe work habits rather than work quality.

---

# Growth Tracking

WorkLedger emphasizes improvement over absolute performance.

The platform should visualize:

* Monthly score progression
* Skill improvement
* Category trends
* Consistency
* Assignment complexity (future)

Growth is often more meaningful than raw averages.

---

# Strength Detection

A category becomes a Contributor Strength when:

* Average score ≥ 8.5
* Minimum of five completed Reviews

Examples:

* Excellent Documentation
* Strong Communication
* Consistent Ownership

Strengths are derived automatically.

---

# Improvement Areas

A category becomes an Improvement Area when:

* Average score ≤ 6.0
* Minimum of three completed Reviews

The goal is constructive coaching rather than criticism.

---

# Review Feedback

Every Review should include structured written feedback.

Recommended structure:

## What Went Well

Positive observations.

---

## Opportunities for Improvement

Specific and actionable suggestions.

---

## Next Recommendation

A practical focus area for the next Assignment.

---

# Review Integrity

Review scores should be:

* Consistent
* Evidence-based
* Explainable
* Transparent

Scores should never be assigned without meaningful feedback.

---

# Metric Calculation Rules

Metrics are recalculated whenever:

* A Review is published
* A Review is corrected
* Historical data is restored

Metrics must never be edited manually.

---

# Future Enhancements

The Scoring Engine is designed to support:

* Weighted categories
* Custom evaluation templates
* Milestone-specific scoring
* Peer reviews
* Multi-reviewer averaging
* Reviewer calibration
* Competency frameworks

These enhancements should extend, not replace, the core model.

---

# Relationship to AI

Artificial Intelligence may assist by:

* Drafting review summaries
* Highlighting strengths
* Identifying recurring weaknesses
* Detecting performance trends

AI may suggest observations.

Only human Reviewers determine official scores.

---

# Guiding Principle

Scores should encourage learning, not ranking.

The Scoring Engine exists to provide fair, consistent, and actionable measurements that help Contributors grow while preserving the integrity of the WorkLedger.

# ADR-001 — Repository Result Strategy

**Status:** Proposed
**Date:** 2026-07-08
**Author:** Gaurav
**Deciders:** WorkLedger Architecture

---

## Context

During Session 005, the seven concrete repository classes were implemented.
Each method delegates to `IStorageProvider`, which returns a typed
`StorageResult<T>` rather than throwing.

The repository layer must translate infrastructure errors into domain errors
before returning to the Application Layer. This enforces the Clean Architecture
dependency rule: the Application Layer must never see a `StorageError`.

A structural decision was required about how repository methods should express
the possibility of failure to their callers.

---

## Problem

Repository methods interact with a fallible persistence layer.
Three questions arose simultaneously:

1. **How should a failed operation be communicated to the caller?**
2. **How should a missing entity be distinguished from a persistence failure?**
3. **Should this strategy be uniform across all repository methods?**

---

## Alternatives Considered

### Alternative A — Throw on failure

Repository methods throw a `DomainError` when persistence fails.
Callers use `try/catch`.

**Pros:**
- Familiar JavaScript/TypeScript idiom
- Simple method signatures: `findById(id): Promise<Workspace | null>`

**Cons:**
- Errors are invisible at the type level — callers can miss them
- `try/catch` usage is inconsistent and easy to forget
- Throws break the "errors as values" pattern established in the domain layer
  (`ValidationResult`, `StorageResult` are both non-throwing)
- Hard to distinguish "entity not found" (expected) from "storage failed" (unexpected)

---

### Alternative B — Result<T, E> wrapper type

Introduce a generic `Result<T, E>` type:

```ts
type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

Repository methods return `Promise<Result<T | null, AnyDomainError>>`.

**Pros:**
- Fully type-safe: callers are forced to handle errors
- Consistent with `StorageResult<T>` in the infrastructure layer
- `null` is unambiguous — it only means "not found", never "failure"
- Pairs naturally with a future `ValidationResult<T>` generic

**Cons:**
- Requires an `isError()` or `isResult()` type guard at every call site
- More verbose: `result.ok ? result.value : handleError(result.error)`
- Changes every call site in services and UI when adopted
- Introduces a new type abstraction before the service layer exists
  to validate whether the ergonomics work in practice

---

### Alternative C — Union return type (current implementation)

Repository methods return `Promise<T | AnyDomainError>`.

Missing entities return `null` as part of the success type:
`Promise<T | null | AnyDomainError>`

**Pros:**
- Simpler than `Result<T, E>` — no wrapper object
- `AnyDomainError` is discriminated by `kind` — narrows cleanly
- Consistent with TypeScript union patterns
- Callers can use type guards to distinguish success from failure
- No new abstractions required in the domain layer today

**Cons:**
- `T | null | AnyDomainError` is a three-way union — callers must
  handle all three cases explicitly
- Entity types that coincidentally have a `kind` field could shadow
  `AnyDomainError` discrimination (low risk in this domain)
- Less ergonomic than `Result<T, E>` for chaining operations
- Callers must import `AnyDomainError` to perform type narrowing

---

## Decision

**Alternative C — Union return type** is adopted for the current
implementation (`Promise<T | AnyDomainError>`).

This decision is intentionally provisional. It allows the infrastructure
and service layers to be implemented and exercised before committing
to a more structured `Result<T, E>` wrapper.

The union approach requires zero new abstractions, compiles cleanly,
and is navigable by any TypeScript developer familiar with discriminated unions.

---

## Implementation

All seven repository interfaces declare return types as:

```ts
create(entity: T):    Promise<T | AnyDomainError>
update(entity: T):    Promise<T | AnyDomainError>
findById(id):         Promise<T | null | AnyDomainError>
findByWorkspace(id):  Promise<T[] | AnyDomainError>
exists(id):           Promise<boolean | AnyDomainError>
```

All seven service interfaces adopt the same convention.

Type narrowing at call sites:

```ts
const result = await contributorRepository.findById(id);

if ('kind' in result) {
  // AnyDomainError — handle infrastructure failure
  return result;
}

if (result === null) {
  // NotFoundError — entity does not exist
  return { kind: 'NotFoundError', entity: 'Contributor', id };
}

// Contributor — proceed with business logic
```

---

## Consequences

### Positive
- All repository methods are uniform and predictable
- Errors are visible at the type level — callers cannot silently ignore them
- No throwing means no surprise control flow
- Discriminated union is navigable without learning a new abstraction

### Negative
- Three-way unions (`T | null | AnyDomainError`) are verbose at call sites
- TypeScript does not enforce exhaustive handling of union members
  (unlike Rust's `Result<T, E>` which requires match-exhaustion)
- The `'kind' in result` guard is fragile if a future entity type
  introduces a `kind` field

### Accepted risks
- The `kind` collision risk is mitigated by the domain model: no entity
  has a `kind` field. If one is introduced, a breaking type error will
  surface immediately.
- Verbosity at call sites is a known cost and acceptable for MVP.
  The service layer will establish consistent narrowing patterns.

---

## Future Considerations

### Migration to Result<T, E>

When service implementations are written and the ergonomics of the union
approach are validated in practice, consider migrating to:

```ts
type Result<T, E = AnyDomainError> =
  | { ok: true; value: T }
  | { ok: false; error: E }
```

This migration would be a single consistent change across:
- All repository interfaces
- All repository implementations
- All service implementations
- Call sites in the Application Layer

A dedicated ADR should be written before this migration begins.

### Relationship to ValidationResult

`ValidationResult` (defined in `src/domain/shared/types.ts`) follows the
same `{ ok: true } | { ok: false; errors: string[] }` pattern. A unified
`Result<T, E>` type would allow validators and repositories to share the
same result vocabulary, making the codebase more internally consistent.

### Session 007 guidance

Service implementations should establish a consistent narrowing helper:

```ts
function isDomainError(value: unknown): value is AnyDomainError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'kind' in value &&
    typeof (value as AnyDomainError).kind === 'string'
  );
}
```

Centralising this guard prevents `'kind' in result` fragility from
spreading across every service method.

---

## References

- `src/domain/shared/errors.ts` — `AnyDomainError` definition
- `src/domain/shared/types.ts` — `ValidationResult` (related pattern)
- `src/infrastructure/storage/IStorageProvider.ts` — `StorageResult<T>`
- `src/infrastructure/repositories/translateStorageError.ts` — error translation
- `docs/09_technical_architecture.md` — dependency rule, repository pattern
- `docs/03.5_system_architecture.md` — layer isolation principles

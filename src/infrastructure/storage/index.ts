/**
 * Storage Infrastructure
 *
 * MVP persistence layer backed by localStorage.
 *
 * Public API:
 *   IStorageProvider  — persistence contract (interface)
 *   StorageResult<T>  — typed operation result
 *   LocalStorageProvider — MVP localStorage implementation
 *   AnyStorageError   — discriminated union of storage error types
 *   serialize / deserialize — lossless JSON encode/decode helpers
 *
 * Usage:
 *   Repositories receive an IStorageProvider via constructor injection.
 *   They never import LocalStorageProvider directly — the provider
 *   is wired at the application composition root.
 *
 * @see docs/09_technical_architecture.md (Infrastructure Layer)
 */

export type { IStorageProvider, StorageResult } from './IStorageProvider';
export { LocalStorageProvider } from './LocalStorageProvider';
export type {
  AnyStorageError,
  StorageErrorKind,
  StorageUnavailableError,
  SerializationError,
  DeserializationError,
  StorageWriteError,
  StorageReadError,
} from './errors';
export { serialize, deserialize } from './serialization';
export type { SerializeResult, DeserializeResult } from './serialization';

/**
 * IPC 错误类型入口 — 调用方按错误契约决定处理方式。
 *
 * Spec ref: spec/S02-ipc-boundary.md 与 spec/S03-error-model.md。
 * 这里只提供 type guard 与 narrow helpers；当前没有全局 Toast/Modal dispatcher。
 */

export { isJsonitaError } from '../types/error';
export type { JsonitaError } from '../types/error';

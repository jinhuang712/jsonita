/**
 * IPC 错误类型入口 — UI 分级响应由调用点决定。
 *
 * Spec ref: spec/02_ipc.html § 3.3 UI 分级响应 + § 8 错误矩阵。
 * 这里只提供 type guard 与 narrow helpers；当前没有全局 Toast/Modal dispatcher。
 */

export { isJsonitaError } from '../types/error';
export type { JsonitaError } from '../types/error';

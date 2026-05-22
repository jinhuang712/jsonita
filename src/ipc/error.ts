/**
 * IPC 错误统一处理入口 — UI 分级响应（Toast / Modal / 状态栏）由调用点决定。
 *
 * Spec ref: spec/02_ipc.html § 3.3 UI 分级响应 + § 8 错误矩阵。
 * 这里只提供 type guard 与 narrow helpers；具体 toast/modal 触发在 shell/Toast.tsx (M1-N4)。
 */

export { isJsonitaError } from '../types/error';
export type { JsonitaError } from '../types/error';

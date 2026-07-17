/**
 * 类型化 Tauri event listen 封装。
 *
 * Spec ref: CLAUDE.md 契约段 event 方向性。
 */

import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { EventMap } from '../types/events';

export function on<K extends keyof EventMap>(
  name: K,
  handler: (payload: EventMap[K]) => void,
): Promise<UnlistenFn> {
  return listen<EventMap[K]>(name, (e) => handler(e.payload));
}

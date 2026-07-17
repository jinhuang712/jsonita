/**
 * JSON Path 工具 — 把"对象路径数组"转 design/screens.md § 4.3 用户友好格式
 * `user.items[0].name`（不用 RFC 6901 pointer，也不带 `$` 前缀）。
 */

export function pathToString(path: (string | number)[]): string {
  let out = '';
  for (const seg of path) {
    if (typeof seg === 'number') {
      out += `[${seg}]`;
    } else {
      // 简化处理：标识符 key 用 . 形式；含特殊字符走 ["..."]
      if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(seg)) {
        out += out === '' ? seg : `.${seg}`;
      } else {
        out += `[${JSON.stringify(seg)}]`;
      }
    }
  }
  return out;
}

/**
 * 计算 node 的 raw text （leaf 带引号 / object/array 走 pretty）。
 * design/screens.md § 12 复制内容规则表。
 */
export function nodeCopyText(value: unknown): string {
  if (typeof value === 'string') return JSON.stringify(value); // 带引号 raw
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value, null, 2);
}

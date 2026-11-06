import { message, t, useMessages } from "../../src/i18n/translate";
import original from "../../src/i18n/locales/zh-CN.json";
import supplement from "../../src/i18n/locales/zh-CN-extra.json";

useMessages("zh-CN", { ...original, ...supplement, Search: "搜索" });

/** Rendered strings only; catalog records and saved data never pass through here. */
export function translate(source: string): string {
  // The unmodified client assembles entire rendered task rows. Translate their
  // authored content independently from status marks and live progress counters.
  const progress = source.match(/^(\s*[✓◆•☑✔]?\s*)(.+?)(\s+\(\s*[\d,]+\s*\/\s*[\d,]+\s*\)\s*)$/s);
  if (progress) {
    const body = translate(progress[2]);
    if (body !== progress[2]) return progress[1] + body + progress[3];
  }
  const marked = source.match(/^(\s*[✓◆•☑✔]\s*)(\S.+)$/s);
  if (marked) {
    const body = translate(marked[2]);
    if (body !== marked[2]) return marked[1] + body;
  }
  const reward = source.match(/^(\s*)Reward:\s*(.+?)(\s*)$/s);
  if (reward) return reward[1] + message("Reward: {0}", translate(reward[2])) + reward[3];
  const timed = source.match(/^(\s*)(Resets in|Ready in|Time remaining:)\s+(.+?)(\s*)$/s);
  if (timed) return timed[1] + message(`${timed[2]} {0}`, translate(timed[3])) + timed[4];
  const translated = t(source);
  if (translated !== source) return translated;
  const trimmed = source.trim();
  if (trimmed !== source && t(trimmed) !== trimmed) return source.replace(trimmed, () => t(trimmed));
  const level = source.match(/^(\s*(?:🔒\s*)?)Lvl\s+(\d+)(\s*)$/);
  if (level) return `${level[1]}${level[2]}级${level[3]}`;
  // A displayed bundle can carry several catalog names. Translate each known
  // item independently; leave unknown/user-authored words alone.
  if (source.includes(", ")) {
    const original = source.split(", ");
    const items = original.map(item => t(item));
    if (items.every((item, i) => item !== original[i])) return items.join("、");
  }
  const bundle = source.match(/^(.*?)(\s*[×x]\s*\d+)$/);
  if (bundle && t(bundle[1]) !== bundle[1]) return t(bundle[1]) + bundle[2];
  const shortcut = source.match(/^(.*?)(\s+\([A-Z0-9]\))$/);
  if (shortcut && t(shortcut[1]) !== shortcut[1]) return t(shortcut[1]) + shortcut[2];
  return source;
}

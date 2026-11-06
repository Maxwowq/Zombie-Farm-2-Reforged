import { t, useMessages } from "../../src/i18n/translate";
import original from "../../src/i18n/locales/zh-CN.json";
import supplement from "../../src/i18n/locales/zh-CN-extra.json";

useMessages("zh-CN", { ...original, ...supplement, Search: "搜索" });

/** Rendered strings only; catalog records and saved data never pass through here. */
export function translate(source: string): string {
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

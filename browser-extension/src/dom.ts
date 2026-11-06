import { translate } from "./translate";

const ATTRIBUTES = ["title", "alt", "aria-label", "placeholder"];
const EXCLUDED = [
  "script", "style", "noscript", "pre", "code", "input", "textarea", "[contenteditable]",
  "[translate='no']", "[data-zf-no-translate]",
  // User-controlled names. Prefer leaving a catalog-looking name in English
  // rather than silently renaming a friend's farmer or a custom-named zombie.
  ".nameplate", ".vb-name", ".fr-friend-name", ".prof-name", ".lb-name",
  ".fr-who b", ".army-nm", ".zcard-board", ".zr-name", ".zteam-nm",
  ".revive-name", ".farm-layout-name", ".confirm-msg b",
  ".memorial-name", ".ann-body", ".ann-panel > h2", ".ann-item > h3",
  ".stats-section:first-child .stats-row:first-of-type .stats-value",
].join(",");

export function installDomTranslation(): void {
  const excluded = (element: Element | null) => !element || !!element.closest(EXCLUDED);
  function text(node: Text) {
    if (excluded(node.parentElement) || !/[A-Za-z]/.test(node.data)) return;
    const value = translate(node.data);
    if (value !== node.data) {
      // An option with no explicit value takes its value from its visible text.
      // Freeze that original value before translating its label.
      const option = node.parentElement?.closest("option");
      if (option && !option.hasAttribute("value")) option.value = option.text;
      node.data = value;
    }
  }
  function attributes(element: Element) {
    // Inputs' values are never translated, but their hints are authored copy.
    if (element.closest("script,style,[translate='no'],[data-zf-no-translate]")) return;
    for (const name of ATTRIBUTES) {
      const value = element.getAttribute(name);
      if (value === null) continue;
      const translated = translate(value);
      if (translated !== value) element.setAttribute(name, translated);
    }
  }
  function subtree(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) { text(node as Text); return; }
    if (!(node instanceof Element)) return;
    attributes(node);
    if (excluded(node)) return;
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: child => {
        if (child instanceof Element && excluded(child)) {
          attributes(child);
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let child: Node | null;
    while ((child = walker.nextNode())) {
      if (child.nodeType === Node.TEXT_NODE) text(child as Text);
      else attributes(child as Element);
    }
  }

  const observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === "characterData") text(record.target as Text);
      else if (record.type === "attributes") attributes(record.target as Element);
      else for (const node of record.addedNodes) subtree(node);
    }
    if (document.documentElement) document.documentElement.lang = "zh-CN";
  });
  observer.observe(document, { subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: ATTRIBUTES });
  if (document.documentElement) subtree(document.documentElement);
}

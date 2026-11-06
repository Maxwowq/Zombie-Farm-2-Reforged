import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extension = path.join(root, "browser-extension");
const dist = path.join(extension, "dist");
await fs.mkdir(dist, { recursive: true });
await build({ entryPoints: [path.join(extension, "src/index.ts")],
  outfile: path.join(dist, "content.js"), bundle: true, format: "iife", target: "chrome111",
  legalComments: "inline", minify: false });
const matches = ["https://zombiefarmreforged.com/*", "https://www.zombiefarmreforged.com/*",
  "https://actualdoctornerd-ai.github.io/Zombie-Farm-2-Reforged/*"];
if (process.argv.includes("--test-origins")) matches.push("http://localhost:4180/*");
await fs.writeFile(path.join(dist, "manifest.json"), JSON.stringify({
  manifest_version: 3,
  name: "Zombie Farm Reforged 简体中文（实验版）", version: "0.1.0",
  description: "复用原版译文与 Reforged 中文补译，翻译界面及画布文字。非官方扩展。",
  minimum_chrome_version: "111",
  content_scripts: [{ matches, js: ["content.js"], run_at: "document_start", world: "MAIN" }],
}, null, 2) + "\n");
await fs.copyFile(path.join(root, "src/i18n/source.json"), path.join(dist, "translation-source.json"));
await fs.copyFile(path.join(root, "LICENSE"), path.join(dist, "LICENSE-code.txt"));
await fs.copyFile(path.join(extension, "README.md"), path.join(dist, "README.md"));
await fs.copyFile(path.join(extension, "VERIFICATION.md"), path.join(dist, "VERIFICATION.md"));
await fs.writeFile(path.join(dist, "NOTICE.txt"),
  "Original Zombie Farm 2 translations belong to their respective owners and are excluded from the code's MIT license.\n" +
  "Chinese additions and extraction provenance: https://github.com/actualdoctornerd-ai/Zombie-Farm-2-Reforged/pull/22\n" +
  "This is an unofficial local prototype; original artwork, audio and the IPA are not included.\n");
console.log(dist);

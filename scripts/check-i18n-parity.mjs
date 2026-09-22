import { readFileSync } from "node:fs";
const load = (path) => Function(readFileSync(new URL(path, import.meta.url), "utf8").replace("export default", "return").replace(/ as const;\s*$/, ";"))();
const en = load("../src/i18n/locales/en.ts");
const vi = load("../src/i18n/locales/vi.ts");
const keys = (value, prefix = "") => Object.entries(value).flatMap(([key, child]) => child && typeof child === "object" ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`]);
const a = new Set(keys(en)), b = new Set(keys(vi));
const missing = [...a].filter((key) => !b.has(key)).map((key) => `vi missing ${key}`).concat([...b].filter((key) => !a.has(key)).map((key) => `en missing ${key}`));
if (missing.length) { console.error(missing.join("\n")); process.exit(1); }
console.log(`i18n parity OK (${a.size} keys)`);

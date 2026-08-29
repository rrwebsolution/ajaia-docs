import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/** Tiny .env.local loader so standalone scripts don't need a dotenv dependency. */
export function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");

  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch {
    return;
  }

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

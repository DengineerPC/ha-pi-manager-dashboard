import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const roots = ["src", "tests"];
const forbidden = [
  ["direct Lovelace storage access", /\.storage[\\/]lovelace/i],
  ["generic command endpoint", /run_command|shell_command|terminal/i],
  ["developer test entity in production source", /sensor\.test|binary_sensor\.test/],
];

function filesUnder(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : path.endsWith(".ts") ? [path] : [];
  });
}

const files = roots.flatMap(filesUnder);
const errors = [];
for (const file of files) {
  const source = readFileSync(file, "utf8");
  for (const [label, pattern] of forbidden) {
    if (label === "developer test entity in production source" && !file.startsWith("src")) continue;
    if (pattern.test(source)) errors.push(`${file}: ${label}`);
  }
}

if (!files.length || errors.length) {
  for (const error of errors) console.error(error);
  process.exit(1);
}

console.log(`Pi Manager frontend lint passed for ${files.length} TypeScript files.`);

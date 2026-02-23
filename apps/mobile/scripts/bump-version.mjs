#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mobileRoot = path.resolve(__dirname, "..");

const appJsonPath = path.join(mobileRoot, "app.json");
const packageJsonPath = path.join(mobileRoot, "package.json");
const packageLockPath = path.join(mobileRoot, "package-lock.json");

const semverPattern = /^\d+\.\d+\.\d+$/;

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseSemver(version) {
  if (!semverPattern.test(version)) {
    fail(`Invalid version "${version}". Expected format: x.y.z`);
  }
  const [major, minor, patch] = version.split(".").map((part) => Number.parseInt(part, 10));
  return { major, minor, patch };
}

function bumpSemver(currentVersion, mode) {
  const { major, minor, patch } = parseSemver(currentVersion);
  if (mode === "patch") return `${major}.${minor}.${patch + 1}`;
  if (mode === "minor") return `${major}.${minor + 1}.0`;
  if (mode === "major") return `${major + 1}.0.0`;
  fail(`Unsupported bump mode "${mode}".`);
}

function nextVersionCode(currentCode, explicitCode) {
  if (explicitCode !== null) {
    const parsed = Number.parseInt(explicitCode, 10);
    if (!Number.isInteger(parsed) || parsed <= currentCode) {
      fail(`--code must be an integer greater than current versionCode (${currentCode}).`);
    }
    return parsed;
  }
  return currentCode + 1;
}

function parseArgs(rawArgs) {
  if (rawArgs.length === 0) {
    return { command: "patch", setVersion: null, explicitCode: null };
  }

  const command = rawArgs[0];
  const args = rawArgs.slice(1);
  let setVersion = null;
  let explicitCode = null;

  if (command === "set") {
    if (!args[0]) fail(`Missing version. Usage: node scripts/bump-version.mjs set <x.y.z> [--code <n>]`);
    setVersion = args[0];
    args.shift();
  }

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--code") {
      explicitCode = args[i + 1] ?? null;
      i += 1;
      continue;
    }

    // NPM/PowerShell may pass a positional numeric argument instead of "--code <n>".
    if (explicitCode === null && /^\d+$/.test(args[i])) {
      explicitCode = args[i];
    }
  }

  if (!["patch", "minor", "major", "set", "code"].includes(command)) {
    fail(`Unknown command "${command}". Use patch | minor | major | set | code`);
  }

  return { command, setVersion, explicitCode };
}

function stringifyJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function readJson(filePath) {
  const raw = await readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function maybeReadJson(filePath) {
  try {
    return await readJson(filePath);
  } catch {
    return null;
  }
}

async function main() {
  const { command, setVersion, explicitCode } = parseArgs(process.argv.slice(2));

  const appJson = await readJson(appJsonPath);
  const packageJson = await readJson(packageJsonPath);
  const packageLockJson = await maybeReadJson(packageLockPath);

  const currentVersion = String(appJson?.expo?.version || "");
  const currentCode = Number.parseInt(String(appJson?.expo?.android?.versionCode || ""), 10);

  if (!currentVersion) fail(`apps/mobile/app.json is missing expo.version`);
  if (!Number.isInteger(currentCode) || currentCode <= 0) fail(`apps/mobile/app.json has invalid expo.android.versionCode`);

  let updatedVersion = currentVersion;
  if (command === "set") {
    parseSemver(setVersion);
    updatedVersion = setVersion;
  } else if (command === "patch" || command === "minor" || command === "major") {
    updatedVersion = bumpSemver(currentVersion, command);
  }

  const updatedCode = nextVersionCode(currentCode, explicitCode);

  appJson.expo.version = updatedVersion;
  appJson.expo.android.versionCode = updatedCode;
  packageJson.version = updatedVersion;

  if (packageLockJson && typeof packageLockJson === "object") {
    packageLockJson.version = updatedVersion;
    if (packageLockJson.packages && packageLockJson.packages[""]) {
      packageLockJson.packages[""].version = updatedVersion;
    }
  }

  await writeFile(appJsonPath, stringifyJson(appJson), "utf8");
  await writeFile(packageJsonPath, stringifyJson(packageJson), "utf8");
  if (packageLockJson) {
    await writeFile(packageLockPath, stringifyJson(packageLockJson), "utf8");
  }

  const versionChanged = updatedVersion !== currentVersion;
  const versionMessage = versionChanged
    ? `${currentVersion} -> ${updatedVersion}`
    : `${currentVersion} (unchanged)`;
  console.log(`Updated mobile version: ${versionMessage}`);
  console.log(`Updated Android versionCode: ${currentCode} -> ${updatedCode}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});

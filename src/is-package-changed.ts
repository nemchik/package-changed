import fs from "node:fs";
import path from "node:path";
import { findPackage } from "./find-package";
import { getPackageHash } from "./get-package-hash";
import { getLockfile } from "./get-lockfile";
import { getLockfileHash } from "./get-lockfile-hash";
import preferredPM from "preferred-pm";

interface PackageChangedResult {
  hash: string;
  oldHash: string | undefined;
  writeHash(): void;
  isChanged: boolean;
  pm: Awaited<ReturnType<typeof preferredPM>>;
}

interface PackageChangedOptions {
  hashFilename?: string;
  cwd?: string;
  noLockfile?: boolean;
  noHashFile?: boolean;
}

type PackageChangedCallback = (
  result: Omit<PackageChangedResult, "writeHash">,
) => Promise<boolean | undefined>;

async function isPackageChanged(
  options?: PackageChangedOptions,
): Promise<PackageChangedResult>;

async function isPackageChanged(
  options?: PackageChangedOptions,
  callback?: PackageChangedCallback,
): Promise<PackageChangedResult | Omit<PackageChangedResult, "writeHash">>;

async function isPackageChanged(
  options: PackageChangedOptions = {},
  callback?: PackageChangedCallback,
): Promise<PackageChangedResult | Omit<PackageChangedResult, "writeHash">> {
  const {
    hashFilename = ".packagehash",
    cwd = process.cwd(),
    noLockfile,
    noHashFile,
  } = options;
  const packagePath = findPackage({ cwd });
  if (!packagePath) {
    throw new Error(
      "Cannot find package.json. Traveling up from current working directory.",
    );
  }
  const pm = await preferredPM(cwd);
  const lockfilePath = !noLockfile
    ? getLockfile({ packagePath, pm })
    : undefined;

  const packageHashPath = path.join(cwd, hashFilename);
  const writeHash = (hash: string | undefined) =>
    hash && fs.writeFileSync(packageHashPath, hash, {});

  const packageHashPathExists = fs.existsSync(packageHashPath);
  const recentDigest = lockfilePath
    ? `${getPackageHash(packagePath)}${getLockfileHash(lockfilePath) ?? ""}`
    : getPackageHash(packagePath);
  const previousDigest =
    packageHashPathExists && fs.readFileSync(packageHashPath, "utf-8");

  // if the hash file doesn't exist
  // or if it does and the hash is different
  const isChanged = !packageHashPathExists || previousDigest !== recentDigest;

  const result = {
    hash: recentDigest,
    isChanged,
    oldHash: previousDigest || undefined,
    pm,
  };

  if (callback) {
    let canWriteHash = await callback(result);
    if (lockfilePath) {
      // hash may have changed since lockfile could have been updated after command
      result.hash = `${getPackageHash(packagePath)}${getLockfileHash(lockfilePath) ?? ""}`;
    }
    if (canWriteHash === undefined) {
      canWriteHash = process.env.CI !== "true";
    }
    if (canWriteHash && !noHashFile) {
      writeHash(result.hash);
    }
  }

  return {
    ...result,
    writeHash: writeHash.bind(null, result.hash),
  };
}

export default isPackageChanged;

import fs from "node:fs";
import path from "node:path";
import type preferredPM from "preferred-pm";

export const getLockfile = ({
  packagePath,
  pm,
}: { packagePath: string; pm: Awaited<ReturnType<typeof preferredPM>> }) => {
  const pmName = pm ? pm.name : "npm";
  switch (pmName) {
    case "bun":
      if (fs.existsSync(path.join(path.dirname(packagePath), "bun.lockb"))) {
        return path.join(path.dirname(packagePath), "bun.lockb");
      }
      if (fs.existsSync(path.join(path.dirname(packagePath), "bun.lock"))) {
        return path.join(path.dirname(packagePath), "bun.lock");
      }
      break;
    case "pnpm":
      if (
        fs.existsSync(path.join(path.dirname(packagePath), "pnpm-lock.yaml"))
      ) {
        return path.join(path.dirname(packagePath), "pnpm-lock.yaml");
      }
      break;
    case "yarn":
      if (fs.existsSync(path.join(path.dirname(packagePath), "yarn.lock"))) {
        return path.join(path.dirname(packagePath), "yarn.lock");
      }
      break;
    default:
      if (
        fs.existsSync(path.join(path.dirname(packagePath), "package-lock.json"))
      ) {
        return path.join(path.dirname(packagePath), "package-lock.json");
      }
  }
};

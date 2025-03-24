import crypto from "node:crypto";
import fs from "node:fs";

export const getLockfileHash = (lockfilePath?: string) => {
  if (!lockfilePath) return;
  const hashSum = crypto.createHash("md5");

  // read lockfile
  const contents = fs.readFileSync(lockfilePath, "utf-8");

  // calculate hash
  hashSum.update(Buffer.from(contents));
  return hashSum.digest("hex");
};

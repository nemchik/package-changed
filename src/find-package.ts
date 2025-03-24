import fs from "node:fs";
import path from "node:path";

export const findPackage = (
  { cwd }: { cwd: string } = {
    cwd: process.cwd(),
  },
) => {
  let current = cwd;
  let last = current;
  do {
    const search = path.join(current, "package.json");
    if (fs.existsSync(search)) {
      return search;
    }
    last = current;
    current = path.dirname(current);
  } while (current !== last);
};

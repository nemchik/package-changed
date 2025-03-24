#!/usr/bin/env node

const { execSync } = require("node:child_process");
const { program } = require("commander");

const { isPackageChanged } = require("../lib/index");

program
  .option("--cwd [cwd]", "Current working directory.")
  .option(
    "--hash-filename [filename]",
    "Filename where hash of dependencies will be written to",
  )
  .option("--no-lockfile", "Skip calculating hash from lockfile")
  .option("--no-hash-file", "Skip writing new hash to .packagehash file");

program
  .command("run [command]", { isDefault: false })
  .action(async (command) => {
    const cwd = program.opts().cwd || process.cwd();
    await isPackageChanged(
      {
        cwd,
        hashFilename: program.opts().hashFilename,
        noLockfile: !program.opts().lockfile,
        noHashFile: !program.opts().hashFile,
      },
      ({ isChanged }) => {
        if (isChanged && command) {
          execSync(command, {
            stdio: "inherit",
            cwd,
          });
        }
      },
    );
  });

program
  .command("install", { isDefault: true })
  .option(
    "--ci",
    "Run 'npm ci' instead of 'npm install'. Even when package is not changed. Default when env.CI=true",
  )
  .option("-r, --registry <registry>", "npm registry url to use")
  .action(async (cmdObj) => {
    const cwd = program.opts().cwd || process.cwd();
    const { ci = process.env.CI === "true", registry } = cmdObj;
    await isPackageChanged(
      {
        cwd,
        hashFilename: program.opts().hashFilename,
        noLockfile: !program.opts().lockfile,
        noHashFile: !program.opts().hashFile,
      },
      ({ isChanged, pm }) => {
        if (isChanged) {
          const pmName = pm ? pm.name : "npm";
          let logChanged = `Package changed. Running '${pmName} ${ci ? "ci" : "install"}' ...`;
          let execChanged = `${pmName} ${ci ? "ci" : "install"}${registry ? ` --registry='${registry}'` : ""}`;
          switch (pmName) {
            case "bun":
              logChanged = `Package changed. Running '${pmName} ${ci ? "install --frozen-lockfile" : "install"}' ...`;
              execChanged = `${pmName} ${ci ? "install --frozen-lockfile" : "install"}${registry ? ` --registry='${registry}'` : ""}`;
              break;
            case "pnpm":
            case "yarn":
              logChanged = `Package changed. Running '${pmName} ${ci ? "install --frozen-lockfile" : "install"}' ...`;
              execChanged = `${pmName} ${ci ? "install --frozen-lockfile" : "install"}`;
              break;
          }
          console.log(logChanged);
          execSync(execChanged, {
            stdio: "inherit",
            cwd,
            env: process.env,
          });
        }
      },
    );
  });

program.parse(process.argv);

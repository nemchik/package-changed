#!/usr/bin/env node

const { execSync } = require('child_process');
const { program } = require('commander');

const { isPackageChanged } = require('../lib/index');

program
    .command('run [command]', { isDefault: true })
    .option('--cwd [cwd]', 'Current working directory.')
    .option('--hash-filename [filename]', 'Filename where hash of dependencies will be written to')
    .action((command) => {
        const { isChanged } = isPackageChanged({
            cwd: program.cwd || process.cwd(),
        });

        if (isChanged && command) {
            execSync(command, {
                stdio: 'inherit',
            });
        }
    });

program.parse(process.argv);

#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';

const esm_dirname = path.dirname( process.argv[1] );
let args = [ "--experimental-specifier-resolution=node",
    path.join(esm_dirname, "lnr.js"),
    ...process.argv.slice(2)];
let r = spawn("node", args);

r.stdout.on("data", data => { process.stdout.write(data.toString()); });
r.stderr.on("data", data => { process.stderr.write(data.toString()); });
r.on("close", code => { process.exit(code) });
r.on("error", err => { console.log("Error: " + err) });


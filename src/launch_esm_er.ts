
import {spawn,spawnSync,exec,execSync} from 'child_process';

let args = ["--experimental-specifier-resolution=node", ...process.argv.slice(2)];
let r = spawnSync("node", args);
console.log( r.stdout.toString() );


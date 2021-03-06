
import {spawn} from 'child_process';

let args = ["--experimental-specifier-resolution=node", ...process.argv.slice(2)];
let r = spawn("node", args);

r.stdout.on("data", data => { process.stdout.write(data.toString()); });
r.stderr.on("data", data => { process.stderr.write(data.toString()); });
r.on("close", code => {console.log("Closed with EC: "+code)} );
r.on("error", err => {console.log("Error: "+err)} );


import { Dict, AnyObject, errorLog } from "@blw/utils";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";

function ensureLnrDir() {
    if (!fs.existsSync("./lnr")) {
        let r = fs.mkdirSync("./lnr");
        if (!fs.existsSync("./lnr"))
            return errorLog("Failed creating directory 'lnr'", null, 1);
    }
}

function getLnrDir() {
    let dir = process.cwd();
    while (true) {
        if (fs.existsSync(dir + "/lnr.json")) return path.normalize(dir);
        if (path.normalize(dir) == "/") return 1;
        dir += "/..";
    }
}

export function init() {
    // Make sure the lnr directory and lnr.json exists
    if (fs.existsSync("./lnr.json")) {
        console.log("Already initialized, an lnr.json exists");
        return 0;
    }
    if (ensureLnrDir()) return 2;

    let lnr = {
        packages: {
            // name: version | null
        },
    };
    fs.writeFileSync("./lnr.json", JSON.stringify(lnr));
    fs.writeFileSync("./lnr-local.json", JSON.stringify(lnr));

    console.log("Initialized.");
    return 0;
}

// git@github.com:jonaskello/tsc-import-alias-issue.git
// https://github.com/jonaskello/tsc-import-alias-issue.git
export function repoFetch(
    repo_url: string,
    options: AnyObject
): Promise<any> | number {
    console.log("repoFetch");
    console.log(repo_url);
    console.log(options.bind);

    // Fetch the repo, store under 'lnr' folder
    let lnr_dir = getLnrDir();
    if (typeof lnr_dir != "string")
        return errorLog("Failed finding lnr root (not initialized?)", null, 1);
    process.chdir(lnr_dir);

    return new Promise((res, rej) => {
        exec(`git clone ${repo_url}`, (e, stdout, stderr) => {
            if (!e) {
                // Note it in lnr.json or lnr-local.json
                let re = new RegExp(".*/([^/]+)\\.git");
                let r = re.exec(repo_url);
                if (!r || r.length < 1) rej("Failed parsing name of repo");
                else {
                    let name = r[1];

                    // Optionally bind it
                    res(0);
                }
            } else {
                rej(e);
            }
        });
    });
}

export function bind(name: string, options: AnyObject) {
    console.log("bind");
    console.log(name);
}

export function unbind(name: string, options: AnyObject) {
    console.log("unbind");
    console.log(name);
}

export function drop(name: string, options: AnyObject) {
    console.log("drop");
    console.log(name);
}

export function status(options: AnyObject) {
    console.log("status");
}

export function install(options: AnyObject) {
    console.log("install");
}

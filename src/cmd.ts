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
export async function repoFetch(
    repo_url: string,
    options: AnyObject
): Promise<any> {
    console.log("repoFetch");
    console.log(repo_url);
    console.log(options.bind);

    // Fetch the repo, store under 'lnr' folder
    let lnr_base_dir = getLnrDir();
    if (typeof lnr_base_dir != "string")
        return errorLog("Failed finding lnr root (not initialized?)", null, 1);
    let lnr_dir = lnr_base_dir + "/lnr";
    try {
        process.chdir(lnr_dir);
    } catch (e) {
        return errorLog(
            "lnr directory invalid (no subdir ''lnr''): " + lnr_dir,
            null,
            1
        );
    }

    let re = new RegExp(".*/([^/]+)^");
    let r = re.exec(repo_url);
    if (!r || r.length < 1)
        return errorLog("Failed parsing name of repo", null, 1);
    let repo_name = r[1];
    if (fs.existsSync(lnr_dir + "/" + repo_name))
        return errorLog("The repo is already fetched: " + repo_name, null, 1);

    try {
        let r = await new Promise((res, rej) => {
            exec(`git clone ${repo_url}`, (e, stdout, stderr) => {
                if (!e) {
                    // Store it in lnr.json
                    // Optionally bind it
                    res(0);
                } else {
                    rej(e);
                }
            });
        });
        return r;
    } catch (e) {
        return errorLog(e, null, 1);
    }
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

import { Dict, AnyObject, errorLog } from "@blw/utils";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import * as _ from "lodash";

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

function npmNameToRepoName(name: string) {
    return name;
}

function findDependency(lnr_base_dir: string, repo_name: string) {
    // Read package.json
    try {
        let p_json = JSON.parse(lnr_base_dir + "/" + "package.json");
        for (let d of ["dependencies", "devDependencies"]) {
            for (let p in p_json[d]) {
                if (p == repo_name || npmNameToRepoName(p) == repo_name) {
                    // Return if dependency or devDependency and recorded version
                    return [d, p, p_json[d][p]];
                }
            }
        }
    } catch (e) {
        return errorLog("Failed parsing packgage.json", null, 1);
    }
}

function readJsonField(json_file: string, field: string | string[]) {
    // Read package.json
    try {
        let json = JSON.parse(json_file);
        return _.get(json, field);
    } catch (e) {
        return errorLog("Failed readJsonField of: " + json_file, "" + e, 1);
    }
}

function writeJsonField(
    json_file: string,
    field: string | string[],
    value: any
) {
    // Read package.json
    try {
        let json = JSON.parse(json_file);
        _.set(json, field, value);
        fs.writeFileSync(json_file, JSON.stringify(json));
    } catch (e) {
        return errorLog("Failed writeJsonField of: " + json_file, "" + e, 1);
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
    if (fs.existsSync(lnr_dir + "/" + repo_name)) {
        // There might be a mismatch between state file and repo existence
        return errorLog("The repo is already fetched: " + repo_name, null, 1);
    }

    try {
        let r = await new Promise((res, rej) => {
            exec(`git clone ${repo_url}`, (e, stdout, stderr) => {
                if (!e) {
                    // Find out the Node package name
                    let node_name = readJsonField(
                        "./" + repo_name + "/package.json",
                        "name"
                    );
                    if (!node_name)
                        rej(
                            "Failed reading 'name' of package.json of imported repository"
                        );
                    // Store it in lnr.json
                    let file = options.local ? "lnr-local.json" : "lnr.json";
                    try {
                        // Just bindning here, fetching is another step
                        writeJsonField(
                            lnr_base_dir + "/" + file,
                            ["packages", node_name],
                            { repo_name }
                        );

                        if (options.bind) {
                            res(bind(repo_name, options));
                        }
                    } catch (e) {
                        rej("Failed JSON parsing: " + file + " (" + e + ")");
                    }

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
    let lnr_base_dir = getLnrDir();
    if (typeof lnr_base_dir != "string")
        return errorLog("Failed finding lnr root (not initialized?)", null, 1);
    if (!fs.existsSync(lnr_base_dir + "/lnr/" + name))
        return errorLog("Could not find local repository: " + name, null, 3);

    // We have the repository, ready to bind
    let r = findDependency(lnr_base_dir, name);
    let [dev, node_name, node_version] = r ? r : [];
    if (dev === null && options.dev) dev = true;

    // See if it is in lnr.json or lnr-local.json
    let lnr_json_file = "";
    for (let file in ["lnr.json", "lnr-local.json"]) {
        lnr_json_file = lnr_base_dir + "/" + file;
        let lnr_json = JSON.parse(lnr_json_file);
        if (lnr_json && lnr_json[name]) break;
        lnr_json_file = "";
    }
    // If not found in a json file, assume it is in the main file
    if (!lnr_json_file) lnr_json_file = lnr_base_dir + "/" + "lnr.json";

    // Record info in lnr.json
    try {
        let lnr_json = JSON.parse(lnr_json_file);
        lnr_json.packages[name] = {
            node_name,
            node_version,
            dev,
        };
        fs.writeFileSync(lnr_json_file, JSON.stringify(lnr_json));
    } catch (e) {
        return errorLog(
            "Failed JSON parsing: " + lnr_json_file + " (" + e + ")",
            null,
            4
        );
    }

    // Make the link in package.json
    try {
        let pkg_json = JSON.parse(lnr_base_dir + "/package.json");
        let field = dev ? "devDependencies" : "dependencies";
        if (!node_name) node_name = name;
        pkg_json[field][node_name] = "file:./lnr/" + name;
        fs.writeFileSync(
            lnr_base_dir + "/package.json",
            JSON.stringify(pkg_json)
        );
    } catch (e) {
        return errorLog("Failed package.json parsing/writing: " + e, null, 5);
    }

    console.log(
        "Repository " +
            node_name +
            " is bound in package.json. Run npm/yarn link to generate symlinks."
    );
    return 0;
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

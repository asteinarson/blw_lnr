import { Dict, AnyObject, errorLog } from "@blw/utils";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import _ from "lodash";

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

function findDependency(lnr_base_dir: string, repo_name: string) {
    // Read package.json
    try {
        let json_text = fs.readFileSync(lnr_base_dir + "/" + "package.json");
        let p_json = JSON.parse(json_text.toString());
        for (let d of ["dependencies", "devDependencies"]) {
            let r = _.get(p_json, [d, repo_name]);
            if (r) return [d, r];
        }
    } catch (e) {
        return errorLog("Failed parsing packgage.json", null, 1);
    }
}

function readJsonField(json_file: string, field: string | string[]) {
    // Read package.json
    try {
        let json_text = fs.readFileSync(json_file);
        let json = JSON.parse(json_text.toString());
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
        let json_text = fs.readFileSync(json_file);
        let json = JSON.parse(json_text.toString());
        _.set(json, field, value);
        fs.writeFileSync(json_file, JSON.stringify(json, null, 4));
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
    fs.writeFileSync("./lnr.json", JSON.stringify(lnr, null, 4));
    fs.writeFileSync("./lnr-local.json", JSON.stringify(lnr, null, 4));

    console.log("Initialized.");
    return 0;
}

// git@github.com:jonaskello/tsc-import-alias-issue.git
// https://github.com/jonaskello/tsc-import-alias-issue.git
export async function fetch(
    repo_url: string,
    options: AnyObject
): Promise<any> {
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

    let re = new RegExp(".*/([^/.]+)");
    let r = re.exec(repo_url);
    if (!r || r.length < 1)
        return errorLog("Failed parsing name of repo", null, 1);
    let repo_name = r[1];

    let cmd = `git clone ${repo_url}`;
    // There might be a mismatch between state file and repo existence
    if (fs.existsSync(lnr_dir + "/" + repo_name)) cmd = "pwd";

    try {
        let r = await new Promise((res, rej) => {
            exec(cmd, (e, stdout, stderr) => {
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
    let lnr_base_dir = getLnrDir();
    if (typeof lnr_base_dir != "string")
        return errorLog("Failed finding lnr root (not initialized?)", null, 1);

    // See if it is in lnr.json or lnr-local.json
    let lnr_json_file = lnr_base_dir + "/" + "lnr.json";
    let repo_lnr_data = readJsonField(lnr_json_file, ["packages", name]);
    if (!repo_lnr_data) {
        lnr_json_file = lnr_base_dir + "/" + "lnr-local.json";
        repo_lnr_data = readJsonField(lnr_json_file, ["packages", name]);
        if (!repo_lnr_data) {
            // It could be we should just accept it's not recorded, and bind to lnr.json
            return errorLog(
                "No such repository in lnr.json or lnr-local.json",
                null,
                1
            );
        }
    }
    if (repo_lnr_data.node_version) {
        return errorLog(
            "The repository is already bound in package.json",
            null,
            1
        );
    }

    let repo_name = repo_lnr_data.repo_name;
    if (!fs.existsSync(lnr_base_dir + "/lnr/" + repo_name))
        return errorLog("Local repository not found: " + repo_name, null, 1);

    // We have the repository, ready to bind
    let r = findDependency(lnr_base_dir, name);
    let [dev, node_version] = r ? r : [];
    if (dev === null && options.dev) dev = true;

    // Record info in lnr.json
    r = writeJsonField(lnr_json_file, ["packages", name], {
        repo_name,
        node_version,
        dev,
    });
    if (r)
        return errorLog("Failed writing to lnr.json/lnr-local.json: ", null, 1);

    // Make the link in package.json
    let field =
        dev && dev != "dependencies" ? "devDependencies" : "dependencies";
    r = writeJsonField(
        lnr_base_dir + "/package.json",
        [field, name],
        "file:./lnr/" + repo_name
    );
    if (r) return errorLog("Failed package.json parsing/writing: ", null, 5);

    console.log(
        "Repository " +
            name +
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

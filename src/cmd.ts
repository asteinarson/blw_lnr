import { Dict, AnyObject, errorLog } from "@blw/utils";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import _ from "lodash";

function tryThis1(
    f: (...args: any[]) => any,
    args: any[],
    default_val: any = null
) {
    try {
        return f(args);
    } catch (e) {
        return default_val == "__exception_value__" ? e : default_val;
    }
}

function tryThis<T>(f: () => T, default_val: any = null): T {
    try {
        return f();
    } catch (e) {
        return default_val == "__exception_value__" ? e : default_val;
    }
}

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        let r = fs.mkdirSync(dir);
        if (!fs.existsSync(dir))
            return errorLog("Failed creating directory: " + dir, null, 1);
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

function readJsonField(
    json_file: string,
    field: string | string[],
    default_value: any = undefined
) {
    // Read package.json
    try {
        let json_text = fs.readFileSync(json_file);
        let json = JSON.parse(json_text.toString());
        return _.get(json, field);
    } catch (e) {
        let r = default_value === undefined ? 1 : default_value;
        return errorLog("Failed readJsonField of: " + json_file, "" + e, r);
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
    if (!fs.existsSync("node_modules")) {
        return errorLog(
            "There must be a node_modules folder in the lnr base directory",
            null,
            4
        );
    }

    // Make sure the lnr directory and lnr.json exists
    if (fs.existsSync("./lnr.json")) {
        console.log("Already initialized, an lnr.json exists");
        return 0;
    }
    if (ensureDir("./lnr")) return 2;
    if (ensureDir("./lnr/node_modules")) return 3;

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
        return errorLog("Failed parsing name of repo", null, 2);
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
        if (r) return errorLog(r, null, 3);
        else console.log("Repo was fetched to directory: lnr/" + repo_name);
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

    // Move the package into lnr/node_modules
    // We back up the original node module there (potentially used in unbind)
    let re_org_name = new RegExp("^(@[a-zA-Z_]+)/([a-zA-Z_]+)");
    let r1 = re_org_name.exec(name);
    let [org, sub_name] = r1 ? r1.slice(1, 3) : [null, name];
    if (org) ensureDir(lnr_base_dir + "/lnr/node_modules/" + org);
    if (fs.existsSync(lnr_base_dir + "/node_modules/" + name)) {
        fs.renameSync(
            lnr_base_dir + "/node_modules/" + name,
            lnr_base_dir + "/lnr/node_modules/" + name
        );
    }

    // Generate the symlink
    let tgt = (org ? "../../" : "../") + "lnr/" + repo_name;
    fs.symlinkSync(tgt, lnr_base_dir + "/node_modules/" + name);

    console.log(
        "Repository " +
            name +
            " is bound in package.json. Symlink was generated in node_modules."
    );
    return 0;
}

export function unbind(name: string, options: AnyObject) {
    //  Update lnr.json-lnr / lnr-local.json
    // Remove symlink
    // Update package.json with old/new/specified version
    // Or run npm -i module version
    // drop ?
}

export function drop(name: string, options: AnyObject) {
    // Check that not bound
    // Remove repo from lnr.json or lnr-local.json
    // Remove the repository
}

export function status(options: AnyObject) {
    // Check repos against lnr.json
    let lnr_dir = getLnrDir();
    if (typeof lnr_dir != "string") {
        return errorLog(
            "No lnr.json found (in this or parent directory)",
            null,
            1
        );
    }
    lnr_dir += "/";

    // Log output format
    for (let f of ["lnr.json", "lnr-local.json"]) {
        console.log("...modules in: " + f);
        console.log(
            "<package_name> (<repo_name>) \t<bind status> \t<repo version> \t<node version> \t<dep type>"
        );
        let pkgs = readJsonField(lnr_dir + f, "packages");
        for (let m in pkgs) {
            // 'm' is the package.json name of the package
            // Collect info on this repo/package
            let m_info = pkgs[m];
            let lnr_repo = lnr_dir + "lnr/" + m_info.repo_name;
            let fetched = fs.existsSync(lnr_repo);
            let fetched_version = readJsonField(
                lnr_repo + "/package.json",
                "version",
                "<no version>"
            );
            let node_module_path = lnr_dir + "node_modules/" + m;
            let node_module_exist = fs.existsSync(node_module_path);
            let link = tryThis(() => fs.readlinkSync(node_module_path));
            let link_status = "<no link>";
            if (link)
                link_status =
                    link.substring(0, 4) == "lnr/" ? "<bound>" : "<other link>";
            console.log(
                `${m} (${m_info.repo_name}) \t${link_status}  \t${fetched_version} \t${m_info.node_version} \t${m_info.dev}`
            );
        }
    }
}

export function install(options: AnyObject) {
    console.log("install");
}

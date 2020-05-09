#!/usr/bin/env node

import { Command } from "commander";

let cmd = new Command();

cmd.command("init ")
    .description(
        "Initialize the root from where lnr runs from (creates lnr.json)"
    )
    .action(() => {
        console.log("init");
    });

cmd.command("fetch <repo_url>")
    .description("Fetch a repository to current project")
    .option("-b, --bind", "Bind repositry into current package.json")
    .action((repo_url, options) => {
        console.log("fetch");
        console.log(repo_url);
        console.log(options.bind);
    });

cmd.command("bind <name>")
    .description("Bind local repository into package.json - via node_modules")
    .option("-l, --local", "Do a local binding (in file lnr-local.json)")
    .option(
        "-r, --recursive",
        "Also bind package into sub packages (aka Yarn workspaces)"
    )
    .action((name, options) => {
        console.log("bind");
        console.log(name);
        console.log(options.local);
        console.log(options.recursive);
    });

cmd.command("unbind <name>")
    .description("Unbind a local repository from package.json")
    .option("-o, --old_version", "Restore to old version")
    .option(
        "-p, --package_version",
        "Set to version in in package.json, in bound repository"
    )
    .option(
        "-v, --version <version>",
        "Set to explicit version number (or one of 'o', 'p')"
    )
    .action((name, options) => {
        console.log("unbind");
        console.log(name);
        console.log(options.old_version);
        console.log(options.package_version);
        console.log(options.version);
    });

cmd.command("drop <name>")
    .description("Drop the local repository")
    .action((name) => {
        console.log("drop");
        console.log("name");
    });

cmd.command("status")
    .description("Status of repositories/packages from current lnr root")
    .action(() => {
        console.log("status");
    });

cmd.command("install")
    .description("Install and bind packages from current lnr root")
    .option("-f, --fetch_only", "Only fetch repositories")
    .action((options) => {
        console.log("install");
        console.log("options.fetch_only");
    });

cmd.parse(process.argv);

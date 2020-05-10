#!/usr/bin/env node

import { Command } from "commander";
import * as lnr from "./cmd";

let cmd = new Command();

cmd.command("init ")
    .description(
        "Initialize the root from where lnr runs from (creates lnr.json)"
    )
    .action(() => {
        lnr.init();
    });

cmd.command("fetch <repo_url>")
    .description("Fetch a repository to current project")
    .option("-b, --bind", "Bind repositry into current package.json")
    .action((repo_url, options) => {
        lnr.fetch(repo_url, options);
    });

cmd.command("bind <name>")
    .description("Bind local repository into package.json - via node_modules")
    .option("-l, --local", "Do a local binding (in file lnr-local.json)")
    .option(
        "-r, --recursive",
        "Also bind package into sub packages (aka Yarn workspaces)"
    )
    .action((name, options) => {
        lnr.bind(name, options);
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
        lnr.unbind(name, options);
    });

cmd.command("drop <name>")
    .description("Drop the local repository")
    .action((name, options) => {
        lnr.drop(name, options);
    });

cmd.command("status")
    .description("Status of repositories/packages from current lnr root")
    .action((options) => {
        lnr.status(options);
    });

cmd.command("install")
    .description("Install and bind packages from current lnr root")
    .option("-f, --fetch_only", "Only fetch repositories")
    .action((options) => {
        lnr.install(options);
    });

cmd.parse(process.argv);

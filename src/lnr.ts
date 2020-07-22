import Command from "commander";
import * as lnr from "./cmd";

let cmd = Command;

cmd.command("init ")
    .description(
        "Initialize the root from where lnr runs from (creates lnr.json)"
    )
    .action(() => {
        let r = lnr.init();
        process.exit(r);
    });

cmd.command("fetch <repo_url>")
    .description("Fetch a repository to current project")
    .option(
        "-l, --local",
        "Fetch, record repository in file lnr-local.json (instead of lnr.json)"
    )
    .option("-b, --bind", "Bind repositry into current package.json")
    .action((repo_url, options) => {
        lnr.fetch(repo_url, options);
    });

cmd.command("bind <name>")
    .description("Bind local repository into package.json - via node_modules")
    .option(
        "-r, --recursive",
        "Also bind package into sub packages (aka Yarn workspaces)"
    )
    .option("-d, --dev", "Bind as a dev dependency")
    .action((name, options) => {
        lnr.bind(name, options);
    });

cmd.command("unbind <name>")
    .description("Unbind a local repository from package.json")
    .option("-o, --old_version", "Restore to old version (default)")
    .option(
        "-p, --package-version",
        "Set to version in package.json, in bound repository"
    )
    .option(
        "-v, --expl-version <version>",
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
    .option("-v, --verbose", "More info (column headers)")
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

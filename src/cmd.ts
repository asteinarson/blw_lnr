import { Dict, AnyObject } from "@blw/utils";

export function init() {
    console.log("init");
}

export function fetch(repo_url: string, options: AnyObject) {
    console.log("fetch");
    console.log(repo_url);
    console.log(options.bind);
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

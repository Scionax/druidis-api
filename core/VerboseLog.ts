import { config } from "../config.ts";

// deno-lint-ignore no-unused-vars
function log(...args: Array<string | unknown>) {
	if(config.local) { console.log(...args); }
}

export default abstract class VerboseLog {
    
    static isLogging: boolean = config.debug.logging;
    static isVerbose: boolean = config.debug.logging && config.debug.verbose;
    
    static log(...args: Array<string | unknown>) {
        if(VerboseLog.isLogging) {
            console.log(...args);
        }
    }
    
    static verbose(...args: Array<string | unknown>) {
        if(VerboseLog.isVerbose) {
            console.log(...args);
        }
    }
    
    static error(...args: Array<string | unknown>): false {
        if(VerboseLog.isVerbose) {
            console.error(...args);
        }
		return false;
    }
}

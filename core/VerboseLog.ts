import { config } from "../config.ts";

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
}

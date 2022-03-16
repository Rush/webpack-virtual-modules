import type { Compiler, WebpackPluginInstance } from 'webpack';
declare class VirtualModulesPlugin implements WebpackPluginInstance {
    private _staticModules;
    private _compiler;
    private _watcher;
    private _watchRunPatched;
    constructor(modules?: Record<string, string>);
    writeModule(filePath: string, contents: string): void;
    apply(compiler: Compiler): void;
}
export = VirtualModulesPlugin;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFilteredWatchFileSystem = void 0;
function createFilteredWatchFileSystem(wfs) {
    function _wfsWatch(...args) {
        const ret = this.watch.apply(this, args);
        const listenersOfAggregated = this.watcher.rawListeners('aggregated');
        if (listenersOfAggregated.length !== 1) {
            throw new Error('[webpack-virtual-modules] Failed to patch NodeWatchFileSystem: Number of listeners should be exactly 1.');
        }
        const originalListener = listenersOfAggregated[0];
        this.watcher.off('aggregated', originalListener);
        const needToInvalidate = (changes, removals) => {
            const virtualFiles = this.inputFileSystem && this.inputFileSystem._virtualFiles;
            if (virtualFiles) {
                Object.keys(virtualFiles).forEach((path) => {
                    removals.delete(path);
                });
            }
            return changes.size + removals.size > 0;
        };
        const processAggregated = (changes, removals) => {
            if (!needToInvalidate(changes, removals)) {
                this.watcher.once('aggregated', processAggregated);
                return;
            }
            originalListener(changes, removals);
        };
        this.watcher.once('aggregated', processAggregated);
        return ret;
    }
    const wfsWatch = _wfsWatch.bind(wfs);
    return new Proxy(wfs, {
        get(target, key) {
            if (key === 'watch') {
                return wfsWatch;
            }
            return target[key];
        },
    });
}
exports.createFilteredWatchFileSystem = createFilteredWatchFileSystem;
//# sourceMappingURL=wfs.js.map
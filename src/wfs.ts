import type { Watchpack } from 'watchpack';
import type { Watcher, NodeWatchFileSystem } from './types';

export class FilteredWatchFileSystem implements NodeWatchFileSystem {
  public readonly Watchpack: Watchpack.prototype;
  public readonly inputFileSystem;
  public readonly watcherOptions;
  public watcher;

  public constructor(wfsOrig: NodeWatchFileSystem) {
    this.Watchpack = wfsOrig.watcher.constructor;
    this.inputFileSystem = wfsOrig.inputFileSystem;
    this.watcherOptions = wfsOrig.watcherOptions;
    this.watcher = new this.Watchpack(this.watcherOptions);
  }

  public watch(files, directories, missing, startTime, options, callback, callbackUndelayed): Watcher {
    if (!files || typeof files[Symbol.iterator] !== 'function') {
      throw new Error("Invalid arguments: 'files'");
    }
    if (!directories || typeof directories[Symbol.iterator] !== 'function') {
      throw new Error("Invalid arguments: 'directories'");
    }
    if (!missing || typeof missing[Symbol.iterator] !== 'function') {
      throw new Error("Invalid arguments: 'missing'");
    }
    if (typeof callback !== 'function') {
      throw new Error("Invalid arguments: 'callback'");
    }
    if (typeof startTime !== 'number' && startTime) {
      throw new Error("Invalid arguments: 'startTime'");
    }
    if (typeof options !== 'object') {
      throw new Error("Invalid arguments: 'options'");
    }
    if (typeof callbackUndelayed !== 'function' && callbackUndelayed) {
      throw new Error("Invalid arguments: 'callbackUndelayed'");
    }

    const oldWatcher = this.watcher;
    this.watcher = new this.Watchpack(options);

    if (callbackUndelayed) {
      this.watcher.once('change', callbackUndelayed);
    }

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

      if (this.inputFileSystem && this.inputFileSystem.purge) {
        const fs = this.inputFileSystem;
        for (const item of changes) {
          fs.purge(item);
        }
        for (const item of removals) {
          fs.purge(item);
        }
      }
      const times = this.watcher.getTimeInfoEntries();
      callback(null, times, times, changes, removals);
    };

    this.watcher.once('aggregated', processAggregated);

    this.watcher.watch({ files, directories, missing, startTime });

    if (oldWatcher) {
      oldWatcher.close();
    }
    return {
      close: () => {
        if (this.watcher) {
          this.watcher.close();
          this.watcher = null;
        }
      },
      pause: () => {
        if (this.watcher) {
          this.watcher.pause();
        }
      },
      getAggregatedRemovals: () => {
        const items = this.watcher && this.watcher.aggregatedRemovals;
        if (items && this.inputFileSystem && this.inputFileSystem.purge) {
          const fs = this.inputFileSystem;
          for (const item of items) {
            fs.purge(item);
          }
        }
        return items;
      },
      getAggregatedChanges: () => {
        const items = this.watcher && this.watcher.aggregatedChanges;
        if (items && this.inputFileSystem && this.inputFileSystem.purge) {
          const fs = this.inputFileSystem;
          for (const item of items) {
            fs.purge(item);
          }
        }
        return items;
      },
      getFileTimeInfoEntries: () => {
        if (this.watcher) {
          return this.watcher.getTimeInfoEntries();
        } else {
          return new Map();
        }
      },
      getContextTimeInfoEntries: () => {
        if (this.watcher) {
          return this.watcher.getTimeInfoEntries();
        } else {
          return new Map();
        }
      },
    };
  }
}

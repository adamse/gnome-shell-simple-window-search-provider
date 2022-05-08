/* exported init */

'use strict';

declare var imports: any;
declare var display: any;
declare function log(what: any): void;

interface ResultMeta {
    id: string;
    name: string;
    description: string;
    createIcon: (size: number) => any;
}

type Callback<input> = (val: input) => void;

interface SearchProvider {
    appInfo: any;

    getInitialResultSet(
        terms: string[],
        callback: Callback<string[]>,
        cancellable: boolean): void;

    getSubsearchResultSet(
        previousResults: string[],
        terms: string[],
        callback: Callback<string[]>,
        cancellable: boolean): void;

    getResultMetas(resultKeys: string[], callback: Callback<ResultMeta[]>): void;

    filterResults<result>(results: result[], maxResults: number): result[];

    activateResult(key: string, terms: string[]): void;
}

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio;

const Me = ExtensionUtils.getCurrentExtension();

const debugLogOn: boolean = false;

function debugLog(str: any): void {
    if (debugLogOn) {
        log(`[Window search provider] ${str}`);
    }
}

interface WindowInfo {
    win: any;
    app: any;
    appName: string;
    title: string;
    name: string;
}

class WindowSearchProvider implements SearchProvider {
    results: any;
    appInfo: any;

    constructor() {
        debugLog(`constructing`);
        this.results = {};

        // Setting up this AppInfo information groups the window search results
        // together in a list-like view instead of big icons. The other gnome
        // extension for window search does it exactly like this.
        this.appInfo = Gio.AppInfo.get_all().filter(function (appInfo) {
            try {
              let id = appInfo.get_id();
              return id.match(/gnome-session-properties/);
            }
            catch (e) {
              return null;
            }
        })[0]

        this.appInfo.get_name = function () {
          return 'Windows';
        };
        this.appInfo.get_description = function () {
          return 'Open windows';
        };
    }

    makeWindowInfo(win: any): WindowInfo  {
        const app = Shell.WindowTracker.get_default().get_window_app(win);
        try {
            const appName = app.get_name();
            const title = win.get_title();
            return {
                win: win,
                app: app,
                appName: appName,
                title: title,
                name: appName + " " + title,
            };
        } catch (exc) {
            debugLog(`failed to get window information, win=${win}, exc=${exc}`);
            return {
                win: win,
                app: app,
                appName: "Not available",
                title: "Not available",
                name: "Not available",
            };
        }
    }

    getInitialResultSet(terms: string[], callback, _cancellable): void {
        debugLog(`getInitialResultSet: terms=${terms.join(" ")}`);
        const sp = this;

        const regex = new RegExp(terms.join('|'), 'i');

        var resultKeys = [];
        var results = {};
        display.get_tab_list(Meta.TabList.NORMAL, null)
            .forEach(function (win, index) {
                const key = 'w' + index;
                const info = sp.makeWindowInfo(win);
                if (regex.test(info.name)) {
                    resultKeys.push(key);
                    results[key] = info;
                }
            });

        sp.results = results;

        debugLog(`found windows: resultKeys=${resultKeys}`);

        callback(resultKeys);
    }

    getResultMetas(resultKeys: string[], callback: Callback<ResultMeta[]>): void {
        debugLog(`getResultMetas: resultKeys=${resultKeys}`);
        const sp = this;

        callback(resultKeys.map(function (key) {
            const result = sp.results[key];
            return {
                id: key,
                name: result.title,
                description: result.appName,
                createIcon: function (size) {
                    return result.app.create_icon_texture(size);
                }
            };
        }));
    }

    filterResults(results: any[], maxResults: number): any[] {
        debugLog(`filterResults: maxResults=${maxResults}`);
        return results;
    }

    getSubsearchResultSet(previousResults, terms, callback, cancellable) {
        debugLog(`getSubsearchResultSet: previousResults=${previousResults}, terms=${terms}`);
        this.getInitialResultSet(terms, callback, cancellable);
    }

    activateResult(key: string, terms: string[]): void {
        debugLog(`activateResult: key=${key}, terms=${terms}`);
        const result = this.results[key];
        Main.activateWindow(result.win);
    }
}

class Extension {
    searchProvider: any;

    constructor() {
        debugLog(`initializing ${Me.metadata.name}`);
    }

    getOverviewSearchResult() {
      if (Main.overview.viewSelector !== undefined) {
        return Main.overview.viewSelector._searchResults;
      } else {
        return Main.overview._overview.controls._searchController._searchResults;
      }
    }

    enable() {
        debugLog(`enable ${Me.metadata.name}`);

        debugLog(`creating search provider`);
        this.searchProvider = new WindowSearchProvider();

        debugLog(`registering new search provider`);

        this.getOverviewSearchResult()._registerProvider(
          this.searchProvider
        );
    }

    disable() {
        debugLog(`disable ${Me.metadata.name}`);

        debugLog(`deregistering search provider`);
        this.getOverviewSearchResult()._unregisterProvider(
          this.searchProvider
        );

        debugLog(`destroying search provider`);
        this.searchProvider = null;

    }
}

function init() {
    return new Extension();
}

/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;

const Me = ExtensionUtils.getCurrentExtension();

const debugLogOn: boolean = false;

function debugLog(str: any): void {
    if (debugLogOn) {
        log(`[Window search provider] ${str}`);
    }
}

interface WindowInfo {
    key: string;
    win: any;
    app: any;
    appName: string;
    title: string;
    name: string;
}

class WindowSearchProvider {
    results: any;

    constructor() {
        debugLog(`constructing`);
        this.results = {};
    }

    _windowInfo(win: any, key: string): WindowInfo  {
        const app = Shell.WindowTracker.get_default().get_window_app(win);
        try {
            const appName = app.get_name();
            const title = win.get_title();
            return {
                key: key,
                win: win,
                app: app,
                appName: appName,
                title: title,
                name: appName + " " + title,
            };
        } catch (exc) {
            debugLog(`failed to get window information, win=${win}, exc=${exc}`);
            return {
                key: key,
                win: win,
                app: app,
                appName: "Not available",
                title: "Not available",
                name: "Not available",
            };
        }
    }

    _match(terms: string[], info: WindowInfo): boolean {
        return true;
    }

    getInitialResultSet(terms: string[], callback, _cancellable): void {
        debugLog(`getInitialResultSet: terms=${terms.join(" ")}`);
        const sp = this;

        const regex = new RegExp(terms.join('|'), 'i');

        var resultKeys = [];
        var results = {};
        global.display.get_tab_list(Meta.TabList.NORMAL, null)
            .forEach(function (win, index) { 
                const key = 'w' + index;
                const info = sp._windowInfo(win, key);
                if (regex.test(info.name)) {
                    resultKeys.push(key);
                    results[key] = info;
                }
            });

        sp.results = results;

        debugLog(`found windows: resultKeys=${resultKeys}`);
        // debugLog(`found windows: results=${results.toJSON()}`);

        callback(resultKeys);
    }

    getResultMetas(resultKeys, callback) {
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

    filterResults(results, maxResults: number) {
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

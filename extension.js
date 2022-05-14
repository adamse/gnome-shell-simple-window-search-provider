/* exported init */
'use strict';
var ExtensionUtils = imports.misc.extensionUtils;
var Main = imports.ui.main;
var Meta = imports.gi.Meta;
var Shell = imports.gi.Shell;
var Gio = imports.gi.Gio;
var Me = ExtensionUtils.getCurrentExtension();
var debugLogOn = false;
function debugLog(str) {
    if (debugLogOn) {
        log("[Window search provider] " + str);
    }
}
var WindowSearchProvider = /** @class */ (function () {
    function WindowSearchProvider() {
        debugLog("constructing");
        this.results = {};
        // Setting up this AppInfo information groups the window search results
        // together in a list-like view instead of big icons. The other gnome
        // extension for window search does it exactly like this.
        this.appInfo = Gio.AppInfo.get_all().filter(function (appInfo) {
            try {
                var id = appInfo.get_id();
                return id.match(/gnome-session-properties/);
            }
            catch (e) {
                return null;
            }
        })[0];
        this.appInfo.get_name = function () {
            return 'Windows';
        };
        this.appInfo.get_description = function () {
            return 'Open windows';
        };
    }
    WindowSearchProvider.prototype.makeWindowInfo = function (win) {
        var app = Shell.WindowTracker.get_default().get_window_app(win);
        try {
            var appName = app.get_name();
            var title = win.get_title();
            return {
                win: win,
                app: app,
                appName: appName,
                title: title,
                name: appName + " " + title
            };
        }
        catch (exc) {
            debugLog("failed to get window information, win=" + win + ", exc=" + exc);
            return {
                win: win,
                app: app,
                appName: "Not available",
                title: "Not available",
                name: "Not available"
            };
        }
    };
    WindowSearchProvider.prototype.getInitialResultSet = function (terms, callback, _cancellable) {
        debugLog("getInitialResultSet: terms=" + terms.join(" "));
        var sp = this;
        var regex = new RegExp(terms.join('|'), 'i');
        var resultKeys = [];
        var results = {};
        global.display.get_tab_list(Meta.TabList.NORMAL, null)
            .forEach(function (win, index) {
            var key = 'w' + index;
            var info = sp.makeWindowInfo(win);
            if (regex.test(info.name)) {
                resultKeys.push(key);
                results[key] = info;
            }
        });
        sp.results = results;
        debugLog("found windows: resultKeys=" + resultKeys);
        callback(resultKeys);
    };
    WindowSearchProvider.prototype.getResultMetas = function (resultKeys, callback) {
        debugLog("getResultMetas: resultKeys=" + resultKeys);
        var sp = this;
        callback(resultKeys.map(function (key) {
            var result = sp.results[key];
            return {
                id: key,
                name: result.title,
                description: result.appName,
                createIcon: function (size) {
                    return result.app.create_icon_texture(size);
                }
            };
        }));
    };
    WindowSearchProvider.prototype.filterResults = function (results, maxResults) {
        debugLog("filterResults: maxResults=" + maxResults);
        return results;
    };
    WindowSearchProvider.prototype.getSubsearchResultSet = function (previousResults, terms, callback, cancellable) {
        debugLog("getSubsearchResultSet: previousResults=" + previousResults + ", terms=" + terms);
        this.getInitialResultSet(terms, callback, cancellable);
    };
    WindowSearchProvider.prototype.activateResult = function (key, terms) {
        debugLog("activateResult: key=" + key + ", terms=" + terms);
        var result = this.results[key];
        Main.activateWindow(result.win);
    };
    return WindowSearchProvider;
}());
var Extension = /** @class */ (function () {
    function Extension() {
        debugLog("initializing " + Me.metadata.name);
    }
    Extension.prototype.getOverviewSearchResult = function () {
        if (Main.overview.viewSelector !== undefined) {
            return Main.overview.viewSelector._searchResults;
        }
        else {
            return Main.overview._overview.controls._searchController._searchResults;
        }
    };
    Extension.prototype.enable = function () {
        debugLog("enable " + Me.metadata.name);
        debugLog("creating search provider");
        this.searchProvider = new WindowSearchProvider();
        debugLog("registering new search provider");
        this.getOverviewSearchResult()._registerProvider(this.searchProvider);
    };
    Extension.prototype.disable = function () {
        debugLog("disable " + Me.metadata.name);
        debugLog("deregistering search provider");
        this.getOverviewSearchResult()._unregisterProvider(this.searchProvider);
        debugLog("destroying search provider");
        this.searchProvider = null;
    };
    return Extension;
}());
function init() {
    return new Extension();
}

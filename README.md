# simple gnome window title search provider

![screenshot of search results](./simple-search.png)


## references

- https://gitlab.gnome.org/GNOME/gnome-weather/-/blob/main/src/service/searchProvider.js
- https://gjs.guide/extensions/development/creating.html#gnome-extensions-tool
- https://github.com/klorenz/gnome-shell-window-search-provider
- https://developer.gnome.org/documentation/tutorials/search-provider.html


## using


```
# on ubuntu, install gnome-shell-extensions and typescript
sudo apt install gnome-shell-extensions node-typescript
# clone
mkdir -p ~/.local/share/gnome-shell/extensions
cd ~/.local/share/gnome-shell/extensions
git clone https://github.com/adamse/gnome-shell-simple-window-search-provider "window-search-provider@ase.ethnoll.net"
```

restart the gnome session (log out-log in) and you should be able to enable it in the extensions app.


## dev

run nested session for debugging

```
env MUTTER_DEBUG_DUMMY_MODE_SPECS=1024x768 dbus-run-session -- gnome-shell --nested --wayland
```

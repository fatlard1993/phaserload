# Phaserload

## Prerequisites

1. Linux or UNIX
2. node.js >= V6.10.1 [Check out NVM](https://github.com/creationix/nvm)


## Setup and/or update the project and dependencies

/phaserload$ ```./SETUP```


## Run from the project

/phaserload$ ```./server/start```

OR

/phaserload$ ```./server/start <port>```

OR

/phaserload$ ```./server/start dbg <port>```

OR

/phaserload$ ```./server/start dbg lvl <debug_level> <port>```


## Create a dist folder

A dist folder contains a copy of all of the required files, which can be extracted from the rest of the project and ran elsewhere.

/phaserload$ ```gulp dist```


## Run from a dist

All aforementioned options are available, simply prepended with "dist" eg:

/dist$ ```./start dist <other_options>```


## Compile changes

Running this will compile all of the client js, scss, and html into the public folder which is then served via the node app. This will also trigger a refresh request socket to any connected client pages upon completion.

/humanity$ ```gulp dev```

### Problems

If you used NVM to install node and are getting the following error on first run: ```sudo: node: command not found```
Run the following snippet to fix it: ```sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node"```


## Screenshots

More in [etc/screenshots](https://github.com/fatlard1993/phaserload/tree/master/etc/screenshots)

![game_play](./etc/screenshots/game_play.png)
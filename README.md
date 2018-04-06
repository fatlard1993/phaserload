# Phaserload

## Prerequisites

1. Linux or UNIX
2. node.js [Check out NVM](https://github.com/creationix/nvm)


## Setup

/phaserload$ ```./SETUP```


## Update the project and dependencies

/phaserload$ ```./UPDATE```


## Run

/phaserload$ ```./server/start```

OR

/phaserload$ ```./server/start <port>```

OR

/phaserload$ ```./server/start dbg <port>```

OR

/phaserload$ ```./server/start dbg lvl <debug_level> <port>```


## Create dist folder

The dist folder contains a copy of all of the required files, which can be extracted from the rest of the project and ran elsewhere.

/phaserload$ ```gulp dist```


## Run from dist

All aforementioned options are available, simply prepended with "dist" eg:

/dist$ ```./start dist <other_options>```


## Compile changes

This will also refresh any connected client pages.

/phaserload$ ```gulp dev```

### Problems

```sudo: node: command not found``` to fix this (if you used NVM) run: ```sudo ln -s "$NVM_DIR/versions/node/$(nvm version)/bin/node" "/usr/local/bin/node"```

## Screenshots

More in ```./screenshots```

![game_play](./etc/screenshots/game_play.png)
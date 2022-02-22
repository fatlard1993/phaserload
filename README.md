# Phaserload

Inspired by the countless hours I spent playing [Motherload](http://www.xgenstudios.com/motherload-goldium/)

![comic](http://art.penny-arcade.com/photos/i-pxNH7Mz/0/XL/i-pxNH7Mz-X3.jpg)

## Prerequisites

* nodeJS >= v12

## Setup

1. `npm install`
1. `npm run build`
1. `npm run server`

## Screenshots

![game_play](./etc/screenshots/game_play.png)

## Dev

To run the hot reload dev server for the frontend run `npm run dev` while the server is running

### JFXR

Currently using [this awesome JS reincarnation of SFXR/BFXR](https://jfxr.frozenfractal.com/) to create sound effects.

### TODO

- Build in pallet swapping instead of separate image source for each color difference: https://github.com/Colbydude/phaser-3-palette-swapping-example
- allow discarding material to lighten load
- add refurbished teleporters that sometimes don't work and sometimes aren't very accurate
- add engine upgrade to increase base speed
- player orientation should be decided and tracked server side
- spaceco_hurt1 frame is missing
- add mouse/touch control
- handle player/spaceco deaths
- make spaceco supplies finite
- add a spaceco refresh event where the spaceco items get refreshed and the materials are reset
- translate all the mineral colors to names for UI
- sensor range upgrades
	- how many blocks wide and tall you can see
	- should also come with a way to configure how much is shown on-screen and the entire field could be displayed in a sort of minimap
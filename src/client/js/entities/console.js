import log from '../logger';
import lang from '../lang/index';
import phaserload from '../phaserload';

import util from 'js-util';
import dom from 'dom';

import Phaser from './node_modules/phaser/dist/phaser.min.js';

class ConsoleEntity extends Phaser.GameObjects.Image {
	constructor(){
		super(phaserload.scene, 0, 0, 'map', 'hud');

		phaserload.groups.interfaces.add(this, true);

		this.setDepth(phaserload.layers.interfaces);
		this.setScrollFactor(0, 0);
		this.setOrigin(0);
		this.setScale(0.4);
		this.setInteractive();
		this.on('pointerdown', this.toggle.bind(this));

		this.elem = dom.createElem('div', { id: 'console', appendTo: document.body });

		this.draw_small();
	}

	open(){
		dom.empty(this.elem);

		this.isOpen = true;
		//todo account for game scale

		phaserload.scene.tweens.add({
			targets: this,
			scaleX: 2,
			scaleY: 2,
			duration: 400,
			ease: 'Linear',
			onComplete: this.draw_big.bind(this)
		});
	}

	close(){
		dom.empty(this.elem);

		phaserload.scene.tweens.add({
			targets: this,
			scaleX: 0.4,
			scaleY: 0.4,
			duration: 300,
			ease: 'Linear',
			onComplete: this.draw_small.bind(this)
		});
	}

	toggle(){
		this[this.isOpen ? 'close' : 'open'].apply(this);
	}

	draw_small(){
		this.isOpen = false;

		this.elem.className = 'small';

		log()('draw_small');

		['position', 'credits', 'health', 'fuel', 'hull'].forEach((name, index) => {
			const elem = this.elem.children[index] || dom.createElem('div', { appendTo: this.elem });

			//todo {fuel, hull, health} account for max values and display a percentage and/or a bar

			elem.textContent = (name === 'position' ? `GPS: x${phaserload.player[name].x} y${phaserload.player[name].y}` : `${name === 'credits' ? '$' : util.capitalize(name)}: ${phaserload.player[name]}`);
		});
	}

	draw_big(){
		log()('draw_big');

		this.elem.className = 'big';

		//todo if near spaceco open spaceco console
		//todo if near another player open the player trade console

		Object.keys(phaserload.player.inventory).forEach((name) => {
			dom.createElem('div', { textContent: `${name}: ${phaserload.player.inventory[name]}`, appendTo: this.elem });
		});
	}

	draw_briefing(){
		log()('draw_briefing');

		//todo add briefing text for this world
		//todo add general help info
	}

	draw_notification(){
		log()('draw_notification');
	}

	draw_inventory(){
		log()('draw_inventory');

		//todo add inventory items
		//todo add hull contents
		//todo add drill configuration editor
		//todo add general help info
	}

	draw_spaceco(){
		log()('draw_spaceco');

		//todo add price list (the more of a particular mineral they have the less they will buy it for. Also price list starts out based on the world config (what colors are available))
		//todo add fuel products (prices are based on world config)
		//todo add drill part products (availability and price based on world config)
		//todo add purchaseable items (availability and price based on world config)
	}

	draw_trade(){
		log()('draw_trade');

		//todo add inventory items
		//todo add hull contents
		//todo add trade page that shows the current offer from both sides
	}

	draw_load_item_slot(){
		log()('draw_load_item_slot');

		//todo add itemSlot-able inventory items
	}
}
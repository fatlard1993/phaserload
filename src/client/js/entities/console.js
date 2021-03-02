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

		phaserload.scene.sound.play('console_open');

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

		phaserload.scene.sound.play('blip');

		phaserload.scene.tweens.add({
			targets: this,
			scaleX: 0.4,
			scaleY: 0.4,
			duration: 300,
			ease: 'Linear',
			onComplete: this.draw_small.bind(this)
		});
	}

	notify(text){
		phaserload.scene.sound.play('alert');

		phaserload.scene.tweens.add({
			targets: this,
			scaleX: 0.5,
			scaleY: 0.5,
			duration: 150,
			ease: 'Linear',
			onComplete: this.draw_notification.bind(this, text)
		});
	}

	toggle(){
		this[this.isOpen ? 'close' : 'open'].apply(this);
	}

	draw_notification(textContent){
		this.isOpen = 'notification';

		dom.empty(this.elem);

		this.elem.className = 'small';

		log()('draw_notification', textContent);

		dom.createElem('div', { appendTo: this.elem, textContent });

		setTimeout(() => {
			if(!this.isOpen || this.isOpen === 'notification') this.close();
		}, 1500);
	}

	draw_small(){
		this.isOpen = false;

		this.elem.className = 'small';

		log()('draw_small');

		['position', 'credits', 'health', 'fuel', 'cargoBay'].forEach((name, index) => {
			const elem = this.elem.children[index] || dom.createElem('div', { appendTo: this.elem });

			if(name === 'cargoBay'){
				elem.textContent = `Cargo: ${util.toFixed(phaserload.player.cargoBay.available, 1, true)}%`;
			}

			else if(name === 'fuel'){
				elem.textContent = `Fuel: ${util.toFixed(phaserload.player.fuel.available, 1, true)}%`;
			}

			else if(name === 'health'){
				elem.textContent = `Health: ${util.toFixed(phaserload.player.health.available, 1, true)}%`;
			}

			else elem.textContent = (name === 'position' ? `GPS: x${phaserload.player[name].x} y${phaserload.player[name].y}` : `${name === 'credits' ? '$' : util.capitalize(name)}: ${phaserload.player[name]}`);
		});
	}

	draw_big(){
		log()('draw_big');

		this.elem.className = 'big';

		//todo if near spaceco open spaceco console
		//todo if near another player open the player trade console

		dom.createElem('div', { textContent: '[Inventory]', appendTo: this.elem });

		Object.keys(phaserload.player.inventory).forEach((name) => {
			dom.createElem('div', { textContent: `${name}: ${phaserload.player.inventory[name]}`, appendTo: this.elem });
		});

		dom.createElem('div', { textContent: '[Cargo Bay Material]', appendTo: this.elem });

		Object.keys(phaserload.player.cargoBay.material).forEach((name) => {
			dom.createElem('div', { textContent: `${name}: ${phaserload.player.cargoBay.material[name]}`, appendTo: this.elem });
		});
	}

	draw_briefing(){
		log()('draw_briefing');

		//todo add briefing text for this world
		//todo add general help info
	}

	// draw_notification(){
	// 	log()('draw_notification');

	// 	//todo add notification (stay small || add notification ui to the pre-existing big ui structure)
	// 	// eg: open to trade with spaceco/player.name || spaceco/player.name died || cargoBay almost full || almost out of fuel || health is low || ect..
	// }

	draw_inventory(){
		log()('draw_inventory');

		//todo add inventory items
		//todo add cargoBay contents
		//todo add drill configuration editor
		//todo add general help info
	}

	draw_spaceco(){
		log()('draw_spaceco');

		//todo add price list (the more of a particular mineral they have the less they will buy it for. Also price list starts out based on the world config (what colors are available))
		//todo add fuel products (prices are based on world config)
		//todo add drill part products (availability and price based on world config)
		//todo add purchaseable items (availability and price based on world config)\
		//todo add player stats: health, fuel, credits
	}

	draw_trade(){
		log()('draw_trade');

		//todo add inventory items
		//todo add cargoBay contents
		//todo add trade page that shows the current offer from both sides
	}

	draw_load_item_slot(){
		log()('draw_load_item_slot');

		//todo add itemSlot-able inventory items
	}
}
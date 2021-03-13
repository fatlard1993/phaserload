import log from '../logger';
// import lang from '../lang/index';
import phaserload from '../phaserload';

import util from 'js-util';
import dom from 'dom';
import socketClient from 'socket-client';

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
		this.on('pointerdown', () => { if(!this.isOpen) this.open(); });

		this.elem = dom.createElem('div', { id: 'console', appendTo: document.body });

		this.draw_small();
	}

	open(){
		dom.empty(this.elem);

		this.isOpen = true;
		//todo account for game scale

		phaserload.playSound('console_open');

		phaserload.scene.tweens.add({
			targets: this,
			scaleX: 2,
			scaleY: 2,
			duration: 400,
			ease: 'Linear',
			onComplete: socketClient.reply.bind(this, 'console_connect', true)
		});
	}

	close(){
		dom.empty(this.elem);

		phaserload.playSound('blip');

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
		phaserload.playSound('alert');

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

		//todo add notification (stay small || add notification ui to the pre-existing big ui structure)
		// eg: open to trade with spaceco/player.name || spaceco/player.name died || cargoBay almost full || almost out of fuel || health is low || ect..

		this.elem.className = 'small';

		log()('draw_notification', textContent);

		dom.createElem('div', { appendTo: this.elem, textContent });

		setTimeout(() => {
			if(!this.isOpen || this.isOpen === 'notification') this.close();
		}, 1500);
	}

	draw_small(){
		this.isOpen = false;

		log()('draw_small');

		dom.empty(this.elem);

		const assemblyFragment = new DocumentFragment();

		dom.createElem('div', { textContent: `GPS: x${phaserload.player.position.x} y${phaserload.player.position.y}`, appendTo: this.elem });
		dom.createElem('div', { textContent: `Health: ${util.toFixed(phaserload.player.health.available, 1, true)}%`, appendTo: this.elem });
		dom.createElem('div', { textContent: `Fuel: ${util.toFixed(phaserload.player.fuel.available, 1, true)}%`, appendTo: this.elem });
		dom.createElem('div', { textContent: `Cargo: ${util.toFixed(phaserload.player.cargoBay.available, 1, true)}%`, appendTo: this.elem });
		dom.createElem('div', { textContent: `$: ${util.toFixed(phaserload.player.credits, 2, true)}`, appendTo: this.elem });

		this.elem.className = 'small';
		this.elem.appendChild(assemblyFragment);
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

		const assemblyFragment = new DocumentFragment();

		this.navbar = dom.createElem('div', {
			className: 'navbar',
			appendTo: assemblyFragment,
			appendChildren: ['Briefing', 'Help'].map((name, index) => {
				return dom.createElem('button', { textContent: name, className: index === 0 ? 'selected' : '', attr: { 'data-augmented-ui': 'tl-clip bl-clip' } });
			})
		});
		this.content = dom.createElem('div', { className: 'content', attr: { 'data-augmented-ui': 'tl-clip tr-clip br-clip bl-2-clip-y inlay' }, appendTo: assemblyFragment });

		this.elem.className = 'big';
		this.elem.appendChild(assemblyFragment);
	}

	draw_inventory(){
		log()('draw_inventory');

		//todo add inventory items
		//todo add cargoBay contents
		//todo add drill configuration editor
		//todo add settings (volume, alert levels, ect)
		//todo add general help info

		const assemblyFragment = new DocumentFragment();

		this.navbar = dom.createElem('div', {
			className: 'navbar',
			appendTo: assemblyFragment,
			appendChildren: ['Items', 'Cargo Bay', 'Drill Config', 'Settings', 'Help'].map((name, index) => {
				return dom.createElem('button', {
					textContent: name,
					className: index === 0 ? 'selected' : '',
					attr: { 'data-augmented-ui': 'tl-clip bl-clip' },
					onPointerPress: (evt) => {
						this.navbar.getElementsByClassName('selected')[0].classList.remove('selected');

						evt.target.classList.add('selected');

						phaserload.playSound('blip');

						this[`draw_inventory_${util.toCamelCase(name.toLowerCase())}`]();
					}
				});
			})
		});
		this.content = dom.createElem('div', { className: 'content', attr: { 'data-augmented-ui': 'tl-clip tr-clip br-clip bl-2-clip-y inlay' }, appendTo: assemblyFragment });

		this.draw_inventory_items();

		this.elem.className = 'big';
		this.elem.appendChild(assemblyFragment);
	}

	draw_inventory_items(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Items]', appendTo: this.content });

		Object.keys(phaserload.player.inventory).forEach((name) => {
			dom.createElem('div', { textContent: `${util.capitalize(name)}: ${phaserload.player.inventory[name]}`, appendTo: this.content });
		});
	}

	draw_inventory_cargoBay(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Cargo Bay Material]', appendTo: this.content });

		Object.keys(phaserload.player.cargoBay.material).forEach((name) => {
			dom.createElem('div', { textContent: `${util.capitalize(name.split('_')[0])} ${util.capitalize(phaserload.options.mineralNames[name.split('_')[1]])}: ${phaserload.player.cargoBay.material[name]}`, appendTo: this.content });
		});
	}

	draw_inventory_drillConfig(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Drill Config]', appendTo: this.content });
	}

	draw_inventory_settings(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Settings]', appendTo: this.content });
		dom.createElem('div', { textContent: `Sounds Volume: ${phaserload.config.volume.sounds * 100}%`, appendTo: this.content });
		dom.createElem('div', { textContent: `Music Volume: ${phaserload.config.volume.sounds * 100}%`, appendTo: this.content });
		dom.createElem('div', { textContent: `Health Alert: ${phaserload.config.alert.health}%`, appendTo: this.content });
		dom.createElem('div', { textContent: `Cargo Alert: ${phaserload.config.alert.cargo}%`, appendTo: this.content });
		dom.createElem('div', { textContent: `Fuel Alert: ${phaserload.config.alert.fuel}%`, appendTo: this.content });
	}

	draw_inventory_help(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Help]', appendTo: this.content });
	}

	draw_spaceco(){
		log()('draw_spaceco');

		//todo add price list (the more of a particular mineral they have the less they will buy it for. Also price list starts out based on the world config (what colors are available))
		//todo add fuel products (prices are based on world config)
		//todo add drill part products (availability and price based on world config)
		//todo add purchaseable items (availability and price based on world config)\
		//todo add player stats: health, fuel, credits

		const assemblyFragment = new DocumentFragment();

		this.navbar = dom.createElem('div', {
			className: 'navbar',
			appendTo: assemblyFragment,
			appendChildren: ['Price List', 'Fuel', 'Drill Parts', 'Items'].map((name, index) => {
				return dom.createElem('button', {
					textContent: name,
					className: index === 0 ? 'selected' : '',
					attr: { 'data-augmented-ui': 'tl-clip bl-clip' },
					onPointerPress: (evt) => {
						this.navbar.getElementsByClassName('selected')[0].classList.remove('selected');

						evt.target.classList.add('selected');

						phaserload.playSound('blip');

						this[`draw_spaceco_${util.toCamelCase(name.toLowerCase())}`]();
					}
				});
			})
		});
		this.content = dom.createElem('div', { className: 'content', attr: { 'data-augmented-ui': 'tl-clip tr-clip br-clip bl-2-clip-y inlay' }, appendTo: assemblyFragment });

		this.elem.className = 'big';
		this.elem.appendChild(assemblyFragment);
	}

	draw_spaceco_priceList(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Price List]', appendTo: this.content });
	}

	draw_spaceco_fuel(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Fuel]', appendTo: this.content });
	}

	draw_spaceco_drillParts(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Drill Parts]', appendTo: this.content });
	}

	draw_spaceco_items(){
		dom.empty(this.content);

		dom.createElem('div', { className: 'heading', attr: { 'data-augmented-ui': 'tl-clip tr-clip' }, textContent: '[Items]', appendTo: this.content });
	}

	draw_trade(){
		log()('draw_trade');

		//todo add inventory items
		//todo add cargoBay contents
		//todo add trade page that shows the current offer from both sides

		const assemblyFragment = new DocumentFragment();

		this.navbar = dom.createElem('div', {
			className: 'navbar',
			appendTo: assemblyFragment,
			appendChildren: ['Items', 'Materials', 'Trade'].map((name, index) => {
				return dom.createElem('button', { textContent: name, className: index === 0 ? 'selected' : '', attr: { 'data-augmented-ui': 'tl-clip bl-clip' } });
			})
		});
		this.content = dom.createElem('div', { className: 'content', attr: { 'data-augmented-ui': 'tl-clip tr-clip br-clip bl-2-clip-y inlay' }, appendTo: assemblyFragment });

		this.elem.className = 'big';
		this.elem.appendChild(assemblyFragment);
	}

	draw_load_item_slot(){
		log()('draw_load_item_slot');

		//todo add itemSlot-able inventory items
	}
}

if(typeof module === 'object') module.exports = ConsoleEntity;
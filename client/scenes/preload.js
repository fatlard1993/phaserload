import audio from '../audio';

export default function () {
	this.load.image('fireball', 'img/fireball.png');

	this.load.atlas('map', 'img/map.png', 'img/map.json');

	audio.audioNames.forEach(sound => {
		this.load.audio(sound, `audio/${sound}.wav`);
	});
}

var Modes = {
	normal: {
		worldCategory: 'normal',
		baseDrillMoveTime: 300,
		hudLayout: {
			position: 'GPS',
			credits: '$',
			health: 'Health',
			fuel: 'Fuel',
			hull: 'Hull'
		},
		mineralValues: {
			green: 2.5,
			red: 3.75,
			blue: 4.25,
			purple: 5,
			teal: 6.5,
			'???': 8
		},
		baseGroundValue: 0.08,
		spacecoPrices: {
			gas: 3,
			energy: 6,
			super_oxygen_liquid_nitrogen: 9,
			teleporter: 15,
			responder_teleporter: 25,
			repair: 50,
			upgrade: 100,
			transport: 300,
			timed_charge: 10,
			remote_charge: 15,
			timed_freeze_charge: 15,
			remote_freeze_charge: 20,
		},
		blockBehavior: {
			red: 'lava:~:35',
			green: 'gas:~:15'
		},
		digTime: {
			white: 400,
			orange: 500,
			yellow: 540,
			green: 700,
			teal: 640,
			blue: 700,
			purple: 730,
			pink: 750,
			red: 300,
			black: 800
		}
	}
};

module.exports = Modes;
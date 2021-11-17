module.exports = {
	env: {
		browser: true,
		es6: true,
		node: true,
	},
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
	extends: ['eslint:recommended', 'plugin:prettier/recommended'],
	rules: {
		'no-async-promise-executor': 'off',
	},
};

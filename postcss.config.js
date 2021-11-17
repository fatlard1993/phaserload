module.exports = ctx => ({
	parser: ctx.parser ? 'sugarss' : false,
	map: ctx.env === 'development' ? ctx.map : false,
	plugins: {
		'postcss-simple-vars': {},
		'postcss-mixins': {},
		'postcss-nested': {},
		autoprefixer: {
			flexBox: 'no-2009',
			cascade: false,
		},
	},
});

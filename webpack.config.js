var webpack = require('webpack');
var path = require('path');

var APP_DIR = path.join(__dirname, '..', 'app');

module.exports = {
	debug: true,
	devtool: 'eval',
	entry: ['./famous-app/app/src/main'],
	output: {
		path: __dirname + '/www',
		filename: 'bundle.js'
	},
	module: {
		loaders: [
			{ test: /\.json$/, loader: 'json-loader' }
		]
	},
	resolve: {
		root: [
			path.join(__dirname, './famous-app'),
			path.join(__dirname, './famous-app/app/lib'),
			path.join(__dirname, './famous-app/app/src'),
		],
		extensions: ['', '.js'],
		alias: {
			famous: path.join(__dirname, './famous-app/app/lib/famous/src'),
			jquery: path.join(__dirname, './famous-app/app/lib/jquery/dist/jquery'),
			requirejs: path.join(__dirname, './famous-app/app/lib/requirejs/require'),
			almond: path.join(__dirname, './famous-app/app/lib/almond/almond'),
			backbone: path.join(__dirname, './famous-app/app/lib/backbone/backbone'),
			underscore: path.join(__dirname, './famous-app/app/lib/underscore/underscore'),
			exoskeleton: path.join(__dirname, './famous-app/app/lib/exoskeleton/exoskeleton'),
			fontawesome: path.join(__dirname, './famous-app/app/lib/fontawesome/fonts/*'),
			store: path.join(__dirname, './famous-app/app/lib/store.js/store'),
			text: path.join(__dirname, './famous-app/app/lib/text/text'),
			jstzdetect: path.join(__dirname, './famous-app/app/lib/jstzdetect/jstz.min'),
			jscache: path.join(__dirname, './famous-app/app/lib/jscache/cache'),
			'exoskeleton.localStorage': path.join(__dirname, './famous-app/app/lib/exoskeleton.localStorage/backbone.localStorage'),
			bootstrap: path.join(__dirname, './famous-app/app/lib/bootstrap/dist/js/bootstrap'),
		},

	},
	node: {
		console: true,
		fs: 'empty',
		net: 'empty',
		tls: 'empty'
	}
}

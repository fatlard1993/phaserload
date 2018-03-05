/* global Log */

var View = {
	current: '',
	views: [],
	init: function(slugPrefix, views){
		if(typeof slugPrefix === 'object'){
			views = slugPrefix;
			slugPrefix = '';
		}

		if(slugPrefix === '?'){
			View.queryStyle = true;

			View.slugPrefix = '?view=';
			View.slugRegex = /(?:\/?\?view=)?\/?(.*)?/;
		}
		else{
			View.slugPrefix = slugPrefix || '';
			View.slugRegex = new RegExp(View.slugPrefix +'/?(.*)?');
		}

		View.views = views || View.views;
		View.names = Object.keys(View.views);
		View.count = View.names.length;
	},
	get: function(){
		var view = View.slugRegex.exec(View.queryStyle ? window.location.search : window.location.pathname)[1];

		if(!View.names.includes(view)){
			var noView = view === undefined, historyPath;

			view = View.names[0];

			if(noView) historyPath = View.queryStyle ? View.slugPrefix + view : View.slugPrefix +'/'+ view;

			else historyPath = View.queryStyle ? View.slugPrefix + view : view;

			history.replaceState(null, historyPath, historyPath);
		}

		Log()('get view', view);

		return view;
	},
	set: function(view, stateObj){
		Log()('set view', view);

		var historyPath = View.queryStyle ? View.slugPrefix + view : view;

		history.pushState(stateObj, historyPath, historyPath);
	},
	popstate: function(evt){
		Log()('popstate', evt);

		View.draw();
	},
	draw: function(view){
		View.current = View.names.includes(view) ? view : View.get();

		Log()('draw', View.current);

		View.set(View.current);

		View.views[View.current]();

		if(View.onDraw) View.onDraw();
	}
};

window.addEventListener('popstate', View.popstate);
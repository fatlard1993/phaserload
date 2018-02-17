/* global Log, Cjs */

var Dom = {
	createElem: function(node, settingsObj){
		var elem = document.createElement(node);
		var settingsNames = Object.keys(settingsObj), settingsCount = settingsNames.length;

		for(var x = 0; x < settingsCount; ++x){
			elem[settingsNames[x]] = settingsObj[settingsNames[x]];
		}

		return elem;
	},
	isNodeList: function isNodeList(nodes){
		var nodeCount = nodes.length;

		return typeof nodes === 'object' && (typeof nodeCount === 'number') &&
			/^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(nodes)) &&
			(nodeCount === 0 || (typeof nodes[0] === 'object' && nodes[0].nodeType > 0));
	},
	findAncestor: function findAncestor(el, class_id){
		while((el = el.parentElement) && (class_id[0] === '#' ? '#'+ el.id !== class_id : !el.className.includes(class_id)));

		return el;
	},
	empty: function emptyElem(elem){
		if(!elem || !elem.lastChild) return;

		while(elem.lastChild) elem.removeChild(elem.lastChild);

		return elem;
	},
	remove: function removeElem(elem_s){
		var elemCount = elem_s.length;

		if(elem_s && elemCount){
			elem_s = Cjs.clone(elem_s);

			for(var x = 0, elem; x < elemCount; ++x){
				elem = elem_s[x];

				if(elem) elem.parentElement.removeChild(elem);
			}
		}

		else if(elem_s && elem_s.parentElement) elem_s.parentElement.removeChild(elem_s);
	},
	hide: function hide(elem, cb){
		Dom.animation.add('write', function hide_write(){
			if(!elem.className.includes('disappear')) elem.className += ' disappear';

			if(cb) cb();
		});
	},
	discard: function discard(elem, className, cb){
		Dom.animation.add('write', function discard_write(){
			elem.className += (elem.className.includes('discard') ? ' ' : ' discard ') + (className || '');

			setTimeout(function discard_TO(){
				Dom.hide(elem, cb);
			}, 200);
		});
	},
	show: function show(elem, className, cb){
		Dom.animation.add('write', function show_write(){
			elem.className = elem.className.replace(/\s(disappear|discard)/g, '');

			setTimeout(function show_TO(){
				elem.className = className || '';

				if(cb) cb();
			}, 20);
		});
	},
	setTransform: function(elem, value){
		Dom.animation.add('write', function setTransform_write(){
			elem.style.transform = elem.style.webkitTransform = elem.style.MozTransform = elem.style.msTransform = elem.style.OTransform = value;
		});
	},
	setTitle: function setTitle(title){
		Dom.animation.add('read', function setTitle_read(){
			Dom.Title_p1 = Dom.Title_p1 || document.getElementsByName('apple-mobile-web-app-title')[0];
			Dom.Title_p2 = Dom.Title_p2 || document.getElementsByName('application-name')[0];
			Dom.Title_p3 = Dom.Title_p3 || document.getElementsByName('msapplication-tooltip')[0];

			Dom.animation.add('write', function setTitle_write(){
				document.title = Dom.Title_p1.content = Dom.Title_p2.content = Dom.Title_p3.content = title;
			});
		});
	},
	getScrollbarWidth: function scrollbarWidth(){
		var scrollbarDiv = document.createElement('div');
		scrollbarDiv.id = 'scrollbarDiv';

		// scrollbarDiv.setAttribute('style',
		//	 'position: absolute;' +
		//	 'top: -999;' +
		//	 'width: 100px;' +
		//	 'height: 100px;' +
		//	 'overflow: scroll;'
		// );

		document.body.appendChild(scrollbarDiv);

		var scrollbarWidth = scrollbarDiv.offsetWidth - scrollbarDiv.clientWidth;

		Dom.remove(scrollbarDiv);

		return scrollbarWidth;
	},
	validate: function validate(elem, force){
		Dom.animation.add('write', function validate_write(){
			if(elem && force || elem && elem.validation) elem.className = elem.className.replace(/\svalidated|\sinvalid/g, '');

			if(elem && force) return (elem.className += ' validated');

			if(elem && elem.validation){
				if(new RegExp(elem.validation).test(elem.value)) elem.className += ' validated';

				else elem.className += ' invalid';
			}
		});
	},
	location: {
		hash: {
			get: function getHash(){
				return location.hash.slice(1);
			},
			set: function setHash(hash){
				if(history.pushState) return history.pushState(null, '', '#'+ hash);

				location.hash = '#'+ hash;
			},
		},
		query: {
			parse: function parseQuery(){
				var queryObj = {};

				if(!location.search.length) return queryObj;

				var queryString = location.search.slice(1), urlVariables = queryString.split('&');

				for(var i = 0; i < urlVariables.length; i++){
					var key = urlVariables[i].split('=')[0], value = urlVariables[i].split('=')[1];

					queryObj[decodeURIComponent(key)] = decodeURIComponent(value);
				}

				return queryObj;
			},
			get: function getQuery(param){
				return Dom.location.query.parse()[param];
			},
			set: function setQuery(){
				var obj = {};

				if(typeof arguments[0] === 'object') obj = arguments[0];

				else obj[arguments[0]] = arguments[1];

				obj = Object.assign(Dom.location.query.parse(), obj);

				var query = '?'+ Object.keys(obj).reduce(function(a, k){ a.push(k +'='+ encodeURIComponent(obj[k])); return a; }, []).join('&');

				history.replaceState(null, query, query);
			}
		}
	},
	cookie: {
		get: function getCookie(cookieName){
			var ca = document.cookie.split(';');

			for(var c in ca){ if(ca.hasOwnProperty(c) && ca[c].indexOf(cookieName) >= 0) return ca[c].split('=')[1]; }

			return undefined;
		},
		set: function setCookie(cookieName, cookieValue, expHours){
			var cookie = cookieName +'='+ cookieValue;

			if(expHours){
				var date = new Date();

				date.setTime(date.getTime() + ((expHours || 1) * 60 * 60 * 1000));

				cookie += '; expires='+ date.toUTCString();
			}

			document.cookie = cookie +';';
		},
		delete: function deleteCookie(name){
			document.cookie = name +'=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
		}
	},
	animation: {
		scheduled: false,
		read_tasks: [],
		write_tasks: [],
		add: function addAnimationTask(read_write, task, context/*, arguments*/){
			if(context){
				if(arguments.length > 3){
					var args = Array.prototype.slice.call(arguments, 3);

					args.unshift(context);

					//Log()('animation', 'applying args', args);

					task = task.bind.apply(task, args);
				}
				else task = task.bind(context);
			}

			Dom.animation[read_write +'_tasks'].push(task);

			//Log()('animation', 'add animation', read_write, Dom.animation.read_tasks.length, Dom.animation.write_tasks.length);

			Dom.animation.schedule();

			return task;
		},
		replace: function replaceAnimationTask(read_write, task, context/*, arguments*/){
			if(Dom.animation[read_write +'_tasks'].includes(task)){
				if(context) task = task.bind(context);

				//Log()('animation', 'replace animation');

				Dom.animation[read_write +'_tasks'][Dom.animation[read_write +'_tasks'].indexOf(task)] = task;
			}
			else Dom.animation.add(read_write, task, context);
		},
		runner: function animationRunner(){
			try{
				if(Dom.animation.read_tasks.length){
					//Log()('animation', 'running reads', Dom.animation.read_tasks.length);
					Cjs.run(Dom.animation.read_tasks, 1);
				}
				if(Dom.animation.write_tasks.length){
					//Log()('animation', 'running writes', Dom.animation.write_tasks.length);
					Cjs.run(Dom.animation.write_tasks, 1);
				}
			}
			catch(err){
				Log.error()('animation', 'Dom.animation.runner encountered an error!', err);
			}

			Dom.animation.scheduled = false;

			if(Dom.animation.read_tasks.length || Dom.animation.write_tasks.length) Dom.animation.schedule();
		},
		schedule: function scheduleAnimationTasks(){
			if(Dom.animation.scheduled) return;
			Dom.animation.scheduled = true;

			(window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || function(cb) { return setTimeout(cb, 16); })(Dom.animation.runner);
		}
	},
	maintenance: {
		functions: [],
		init: function initMaintenance(initialMaintenance){
			if(initialMaintenance) Dom.maintenance.functions = Dom.maintenance.functions.concat(initialMaintenance);

			Dom.maintenance.runner = Cjs.run.bind(null, Dom.maintenance.functions);

			window.addEventListener('resize', function windowResize(){
				if(Dom.maintenance.resizeTO){
					clearTimeout(Dom.maintenance.resizeTO);
					Dom.maintenance.resizeTO = null;
				}

				Dom.maintenance.resizeTO = setTimeout(Dom.maintenance.run, 300);
			});

			Dom.maintenance.run();
		},
		run: function runMaintenance(){
			Dom.animation.add('read', function runMaintenance(){
				Dom.availableHeight = document.body.clientHeight;

				Dom.animation.add('write', Dom.maintenance.runner);
			});
		}
	}
};

window.addEventListener('beforeunload', Dom.showLoader);
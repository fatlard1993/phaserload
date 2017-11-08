/* global Log */

var Dom = {
  isNodeList: function(nodes){
    return typeof nodes === 'object' && (typeof nodes.length === 'number') &&
      /^\[object (HTMLCollection|NodeList|Object)\]$/.test(Object.prototype.toString.call(nodes)) &&
      (nodes.length === 0 || (typeof nodes[0] === 'object' && nodes[0].nodeType > 0));
  },
  findAncestor: function findAncestor(el, class_id){
    while ((el = el.parentElement) && (class_id[0] === '#' ? '#'+ el.id !== class_id : !el.className.includes(class_id)));
    return el;
  },
  empty: function emptyElem(elem){
    while(elem.lastChild) elem.removeChild(elem.lastChild);
    return elem;
  },
  remove: function removeElem(elem){
    if(elem && elem.length){
      elem = [].slice.call(elem);
      for(var i = 0; i < elem.length; i++){
        if(elem[i]) elem[i].parentElement.removeChild(elem[i]);
      }
    }
    else if(elem && elem.parentElement) elem.parentElement.removeChild(elem);
  },
  updateStyle: function(elem, styleObj){
    var styleString = elem.getAttribute('style') || '', oldStyleObj = {};
    var styleRegex = /^(.*?):\s(.*?);\s?/;

    while(styleString.length){
      var extract = styleRegex.exec(styleString);
      styleString = styleString.replace(extract[0], '');
      oldStyleObj[extract[1]] = extract[2];
    }

    Dom.setStyle(elem, Object.assign(oldStyleObj, styleObj));
  },
  setTitle: function setTitle(title){
    document.title = title;
    document.getElementsByName('apple-mobile-web-app-title')[0].content = title;
    document.getElementsByName('application-name')[0].content = title;
    document.getElementsByName('msapplication-tooltip')[0].content = title;
  },
  getScrollbarWidth: function scrollbarWidth(){
    var scrollbarDiv = document.createElement('div');
    scrollbarDiv.id = 'scrollbarDiv';
    // scrollbarDiv.setAttribute('style',
    //   'position: absolute;' +
    //   'top: -999;' +
    //   'width: 100px;' +
    //   'height: 100px;' +
    //   'overflow: scroll;'
    // );
    document.body.appendChild(scrollbarDiv);

    var scrollbarWidth = scrollbarDiv.offsetWidth - scrollbarDiv.clientWidth;

    document.body.removeChild(scrollbarDiv);

    return scrollbarWidth;
  },
  validate: function validate(elem, force){
    if(elem && force || elem && elem.validation) elem.className = elem.className.replace(/\svalidated|\sinvalid/g, '');
    if(elem && force) return elem.className += ' validated';
    if(elem && elem.validation){
      if(new RegExp(elem.validation).test(elem.value)) elem.className += ' validated';
      else elem.className += ' invalid';
    }
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
        date.setTime(date.getTime() + ((expHours || 1)*60*60*1000));
        cookie += '; expires='+ date.toUTCString();
      }
      document.cookie = cookie +';';
    },
    delete: function deleteCookie(name){
      document.cookie = name +'=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    }
  }
};
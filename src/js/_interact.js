/* global Socket, Dom */

var Interact = {
	pointerTarget: null,
	clearPointerTarget: function clearPointerTarget(){
		Interact.pointerTarget = null;
	},
	pointerDown: function pointerDown(evt){
		if(Socket) Socket.activity++;

		if(evt.which === 2 || !evt.target.className.includes || !evt.cancelable) return;

		Interact.pointerTarget = evt.target;

		if(Interact.pointerTarget && Interact.onPointerDown) Interact.onPointerDown(evt, Interact.clearPointerTarget);
	},
	pointerUp: function pointerUp(evt){
		if(evt.which === 2 || evt.which === 3 || !evt.target.className.includes || !evt.cancelable) return;

		if(evt.target !== Interact.pointerTarget) return Interact.clearPointerTarget();

		if(evt.target.id === 'refreshPageBtn'){
			evt.preventDefault();

			Interact.clearPointerTarget();

			window.location.reload(false);
		}

		if(Interact.pointerTarget && Interact.onPointerUp) Interact.onPointerUp(evt, Interact.clearPointerTarget);
	},
	pressedKeys: {},
	acceptKeyPresses: false,
	translateKeyCode: function translateKeyCode(keyCode){
		var map = ['', '', '', 'CANCEL', '', '', 'HELP', '', 'BACK_SPACE', 'TAB', '', '', 'CLEAR', 'ENTER', 'ENTER_SPECIAL', '', 'SHIFT', 'CONTROL', 'ALT', 'PAUSE', 'CAPS_LOCK', 'KANA', 'EISU', 'JUNJA', 'FINAL', 'HANJA', '', 'ESCAPE', 'CONVERT', 'NONCONVERT', 'ACCEPT', 'MODECHANGE', 'SPACE', 'PAGE_UP', 'PAGE_DOWN', 'END', 'HOME', 'LEFT', 'UP', 'RIGHT', 'DOWN', 'SELECT', 'PRINT', 'EXECUTE', 'PRINTSCREEN', 'INSERT', 'DELETE', '', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'COLON', 'SEMICOLON', 'LESS_THAN', 'EQUALS', 'GREATER_THAN', 'QUESTION_MARK', 'AT', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'OS_KEY', '', 'CONTEXT_MENU', '', 'SLEEP', 'NUMPAD0', 'NUMPAD1', 'NUMPAD2', 'NUMPAD3', 'NUMPAD4', 'NUMPAD5', 'NUMPAD6', 'NUMPAD7', 'NUMPAD8', 'NUMPAD9', 'MULTIPLY', 'ADD', 'SEPARATOR', 'SUBTRACT', 'DECIMAL', 'DIVIDE', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'F13', 'F14', 'F15', 'F16', 'F17', 'F18', 'F19', 'F20', 'F21', 'F22', 'F23', 'F24', '', '', '', '', '', '', '', '', 'NUM_LOCK', 'SCROLL_LOCK', 'WIN_OEM_FJ_JISHO', 'WIN_OEM_FJ_MASSHOU', 'WIN_OEM_FJ_TOUROKU', 'WIN_OEM_FJ_LOYA', 'WIN_OEM_FJ_ROYA', '', '', '', '', '', '', '', '', '', 'CIRCUMFLEX', 'EXCLAMATION', 'DOUBLE_QUOTE', 'HASH', 'DOLLAR', 'PERCENT', 'AMPERSAND', 'UNDERSCORE', 'OPEN_PAREN', 'CLOSE_PAREN', 'ASTERISK', 'PLUS', 'PIPE', 'HYPHEN_MINUS', 'OPEN_CURLY_BRACKET', 'CLOSE_CURLY_BRACKET', 'TILDE', '', '', '', '', 'VOLUME_MUTE', 'VOLUME_DOWN', 'VOLUME_UP', '', '', 'SEMICOLON', 'EQUALS', 'COMMA', 'MINUS', 'PERIOD', 'SLASH', 'BACK_QUOTE', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'OPEN_BRACKET', 'BACK_SLASH', 'CLOSE_BRACKET', 'QUOTE', '', 'META', 'ALTGR', '', 'WIN_ICO_HELP', 'WIN_ICO_00', '', 'WIN_ICO_CLEAR', '', '', 'WIN_OEM_RESET', 'WIN_OEM_JUMP', 'WIN_OEM_PA1', 'WIN_OEM_PA2', 'WIN_OEM_PA3', 'WIN_OEM_WSCTRL', 'WIN_OEM_CUSEL', 'WIN_OEM_ATTN', 'WIN_OEM_FINISH', 'WIN_OEM_COPY', 'WIN_OEM_AUTO', 'WIN_OEM_ENLW', 'WIN_OEM_BACKTAB', 'ATTN', 'CRSEL', 'EXSEL', 'EREOF', 'PLAY', 'ZOOM', '', 'PA1', 'WIN_OEM_CLEAR', ''];

		return map[keyCode];
	},
	keyDown: function keyDown(evt){
		var keyPressed = Interact.translateKeyCode(evt.which || evt.keyCode);

		if(Interact.pressedKeys[keyPressed]) return;

		else if(!Interact.acceptKeyPresses){
			Interact.pressedKeys[keyPressed] = 2;

			return;
		}

		else Interact.pressedKeys[keyPressed] = 1;

		if(Socket) Socket.activity++;

		if(evt.target.nodeName === 'SELECT') return;

		if(Interact.onKeyDown) Interact.onKeyDown(evt, keyPressed);

		if(document.activeElement && document.activeElement.tagName === 'INPUT') return;

		if(keyPressed === 'D' && evt.shiftKey){
			Dom.location.query.set('DBG', evt.ctrlKey ? 0 : (parseInt(Dom.location.query.get('DBG')) || 0) + 1);

			window.location.reload();
		}
	},
	keyUp: function keyUp(evt){
		var keyPressed = Interact.translateKeyCode(evt.which || evt.keyCode);

		if(!Interact.pressedKeys[keyPressed]) return;

		else if(Interact.pressedKeys[keyPressed] === 2){
			Interact.pressedKeys[keyPressed] = 0;

			return;
		}

		else Interact.pressedKeys[keyPressed] = 0;

		Dom.validate(evt.target);

		if(Interact.onKeyUp) Interact.onKeyUp(evt, keyPressed);
	},
	change: function change(evt){
		Dom.validate(evt.target);

		if(Interact.onChange) Interact.onChange(evt);
	}
};

document.addEventListener('mousedown', Interact.pointerDown);
document.addEventListener('touchstart', Interact.pointerDown);

document.addEventListener('click', Interact.pointerUp);
document.addEventListener('touchend', Interact.pointerUp);

document.addEventListener('keydown', Interact.keyDown);
document.addEventListener('keyup', Interact.keyUp);

document.addEventListener('change', Interact.change);

document.oncontextmenu = function oncontextmenu(evt){
	evt.preventDefault();
};

setTimeout(function acceptKeyPresses_TO(){ Interact.acceptKeyPresses = true; }, 1000);
import './index.css';

import DomElem from '../DomElem';

export default class IconButton extends DomElem {
	constructor({ icon, className, ...rest }) {
		super('button', { className: ['iconButton', icon, className], ...rest });
	}
}

import './index.css';

import DomElem from '../DomElem';

export default class Button extends DomElem {
	constructor({ className, ...rest }) {
		super('button', { className: ['button', className], ...rest });
	}
}

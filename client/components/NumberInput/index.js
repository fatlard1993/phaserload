import './index.css';

import DomElem from '../DomElem';

export default class NumberInput extends DomElem {
	constructor({ className, ...rest }) {
		super('input', { type: 'number', className: ['numberInput', className], ...rest });
	}
}

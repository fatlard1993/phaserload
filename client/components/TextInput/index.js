import './index.css';

import DomElem from '../DomElem';

export default class TextInput extends DomElem {
	constructor({ className, ...rest }) {
		super('input', { type: 'text', className: ['textInput', className], ...rest });
	}
}

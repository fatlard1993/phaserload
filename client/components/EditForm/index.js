import './index.css';

import DomElem from '../DomElem';

export default class EditForm extends DomElem {
	constructor({ className, ...rest }) {
		super('div', { className: ['editForm', className], ...rest });
	}
}

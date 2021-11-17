import './index.css';

import DomElem from '../DomElem';

export default class PageHeader extends DomElem {
	constructor({ className, ...rest } = {}) {
		super('h1', { className: ['pageHeader', className], ...rest });
	}
}

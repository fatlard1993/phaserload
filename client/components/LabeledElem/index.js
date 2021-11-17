import DomElem from '../DomElem';
import Label from '../Label';

export default class LabeledElem {
	constructor(nodeName, { label, appendTo, ...options }) {
		this.label = new Label({ textContent: label, appendTo });
		this.elem = new DomElem(nodeName, { ...options, appendTo: this.labelElem });

		return this;
	}
}

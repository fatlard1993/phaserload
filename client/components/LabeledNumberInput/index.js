import Label from '../Label';
import NumberInput from '../NumberInput';

export default class LabeledNumberInput {
	constructor({ label, appendTo, ...rest }) {
		this.label = new Label({ textContent: label, appendTo });
		this.numberInput = new NumberInput({ appendTo: this.label, ...rest });

		return this;
	}
}

import { Option } from '../models/Component';
import { FormDocument } from '../models/Form';

// Converts string array to options array
export function valuesToOptions(values: String[]) {
    let keyIndex = 0;
    var options: Option[] = [];
    for (let value of values) {
        options.push({
            key: keyIndex,
            value: value
        });
        keyIndex++;
    }

    return options;
};
export const thingyTypes = {
    integeer: 'integer',
    boolean: 'boolean',
    null: 'null',
    returnValue: 'returnValue',
} as const;
type ThingyType = typeof thingyTypes[keyof typeof thingyTypes];

export interface Thingy {
    type: ThingyType;
    inspect: () => string;
}

export class IntegerThingy implements Thingy {
    constructor(public value: number) {}
    type = thingyTypes.integeer;
    inspect = () => String(this.value);
}

export class BooleanThingy implements Thingy {
    constructor(public value: boolean) {}
    type = thingyTypes.boolean;
    inspect = () => String(this.value);
}

export class NullThingy implements Thingy {
    constructor() {}
    type = thingyTypes.null;
    inspect = () => 'null';
}

export class ReturnValueThingy implements Thingy {
    constructor(public value: Thingy) {}
    type = thingyTypes.returnValue;
    inspect = () => this.value.inspect();
}

export class Environment {
    store = new Map<string, Thingy>();
    get = (key: string) => this.store.get(key);
    set = (key: string, value: Thingy) => {
        this.store.set(key, value);
    };
}

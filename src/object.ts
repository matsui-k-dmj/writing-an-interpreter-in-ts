import { FunctionLiteral } from 'ast';

export const thingyTypes = {
    integeer: 'integer',
    boolean: 'boolean',
    null: 'null',
    returnValue: 'returnValue',
    function: 'function',
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

export class FunctionThingy implements Thingy {
    constructor(
        public functionLiteral: FunctionLiteral,
        public env: Environment
    ) {}
    type = thingyTypes.function;
    inspect = () => this.functionLiteral.print();
}

export class Environment {
    store = new Map<string, Thingy>();
    constructor(public outer: Environment | null) {}
    get = (key: string): Thingy | undefined => {
        const thing = this.store.get(key);
        if (thing == null) {
            return this.outer?.get(key);
        }
        return thing;
    };
    set = (key: string, value: Thingy) => {
        this.store.set(key, value);
    };
}

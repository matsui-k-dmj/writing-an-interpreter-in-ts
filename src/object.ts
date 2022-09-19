const objectTypes = {
    integeer: 'integer',
    boolean: 'boolean',
    null: 'null',
} as const;
type ObjectType = typeof objectTypes[keyof typeof objectTypes];

export interface Thingy {
    type: ObjectType;
    inspect: () => string;
}

export class IntegerMonkey implements Thingy {
    constructor(public value: number) {}
    type = objectTypes.integeer;
    inspect = () => String(this.value);
}

export class BooleanMonkey implements Thingy {
    constructor(public value: boolean) {}
    type = objectTypes.boolean;
    inspect = () => String(this.value);
}

export class NullMonkey implements Thingy {
    constructor() {}
    type = objectTypes.null;
    inspect = () => 'null';
}

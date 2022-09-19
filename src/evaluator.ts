import {
    AstRoot,
    BooleanLiteral,
    ExpresstionStatement,
    IntegerLiteral,
    Node,
    PrefixOperation,
    Statement,
} from 'ast';
import { BooleanMonkey, IntegerMonkey, NullMonkey, Thingy } from 'object';

const TRUE = new BooleanMonkey(true);
const FALSE = new BooleanMonkey(false);
const NULL = new NullMonkey();

export const evalMonkey = (node: Node): Thingy => {
    if (node instanceof AstRoot) {
        return evalStatements(node.statementArray);
    } else if (node instanceof ExpresstionStatement) {
        return evalMonkey(node.expression);
    } else if (node instanceof IntegerLiteral) {
        return new IntegerMonkey(node.value);
    } else if (node instanceof BooleanLiteral) {
        return node.value ? TRUE : FALSE;
    } else if (node instanceof PrefixOperation) {
        return evalPrefixOperation(node);
    }
    return NULL;
};

const evalStatements = (statementArray: Statement[]): Thingy => {
    let result: Thingy = new NullMonkey();
    for (const st of statementArray) {
        result = evalMonkey(st);
    }
    return result;
};

const evalPrefixOperation = (node: PrefixOperation): Thingy => {
    const right = evalMonkey(node.right);
    switch (node.operator) {
        case '!':
            return evalBangOperation(right);
        case '-':
            return evalMinusOperation(right);

        default:
            return NULL;
    }
};

/** TRUEだけがTRUEで、それ以外はFALSE */
const evalBangOperation = (right: Thingy) => {
    if (right === TRUE) {
        return FALSE;
    } else {
        return TRUE;
    }
};

/** 数値の場合はマイナスするだけ、そうでなけば NULL */
const evalMinusOperation = (right: Thingy) => {
    if (right instanceof IntegerMonkey) {
        return new IntegerMonkey(-right.value);
    }

    return NULL;
};

import {
    AstRoot,
    BooleanLiteral,
    ExpresstionStatement,
    InfixOperation,
    IntegerLiteral,
    Node,
    PrefixOperation,
    Statement,
} from 'ast';
import { BooleanMonkey, IntegerMonkey, NullMonkey, Thingy } from 'object';
import { tokens } from 'token';

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
    } else if (node instanceof InfixOperation) {
        return evalInfixOperation(node);
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

/** 中置演算子 */
const evalInfixOperation = (node: InfixOperation): Thingy => {
    const left = evalMonkey(node.left);
    const right = evalMonkey(node.right);
    if (
        (
            [
                tokens.plus,
                tokens.minus,
                tokens.asterisk,
                tokens.slash,
                tokens.lessThan,
                tokens.greaterThan,
            ] as string[]
        ).includes(node.operator)
    ) {
        return evalMathInfixOperation(node.operator, left, right);
    } else if (
        ([tokens.eq, tokens.notEq] as string[]).includes(node.operator)
    ) {
        return evalEqualityInfixOperation(node.operator, left, right);
    }

    return NULL;
};

/** 数値演算 */
const evalMathInfixOperation = (
    operator: string,
    left: Thingy,
    right: Thingy
): Thingy => {
    if (!(left instanceof IntegerMonkey) || !(right instanceof IntegerMonkey))
        return NULL;

    switch (operator) {
        case tokens.plus:
            return new IntegerMonkey(left.value + right.value);
        case tokens.minus:
            return new IntegerMonkey(left.value - right.value);
        case tokens.asterisk:
            return new IntegerMonkey(left.value * right.value);
        case tokens.slash:
            return new IntegerMonkey(left.value / right.value);
        case tokens.lessThan:
            return left.value < right.value ? TRUE : FALSE;
        case tokens.greaterThan:
            return left.value > right.value ? TRUE : FALSE;
        default:
            return NULL;
    }
};

/** == と != */
const evalEqualityInfixOperation = (
    operator: string,
    left: Thingy,
    right: Thingy
): Thingy => {
    if (left instanceof IntegerMonkey && right instanceof IntegerMonkey) {
        switch (operator) {
            case tokens.eq:
                return left.value === right.value ? TRUE : FALSE;
            case tokens.notEq:
                return left.value !== right.value ? TRUE : FALSE;
            default:
                return NULL;
        }
    } else if (
        left instanceof BooleanMonkey &&
        right instanceof BooleanMonkey
    ) {
        // 値ではなく参照の比較でOK
        switch (operator) {
            case tokens.eq:
                return left === right ? TRUE : FALSE;
            case tokens.notEq:
                return left !== right ? TRUE : FALSE;
            default:
                return NULL;
        }
    }

    return NULL;
};

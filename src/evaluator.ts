import {
    AstRoot,
    BlockStatement,
    BooleanLiteral,
    ExpresstionStatement,
    IfExpression,
    InfixOperation,
    IntegerLiteral,
    Node,
    PrefixOperation,
    ReturnStatement,
    Statement,
} from 'ast';
import {
    BooleanThingy,
    IntegerThingy,
    NullThingy,
    ReturnValueThingy,
    Thingy,
} from 'object';
import { tokens } from 'token';

const TRUE = new BooleanThingy(true);
const FALSE = new BooleanThingy(false);
const NULL = new NullThingy();

export const evalNode = (node: Node): Thingy => {
    if (node instanceof AstRoot) {
        return evalAstRoot(node.statementArray);
    } else if (node instanceof BlockStatement) {
        return evalBlockStatements(node.statementArray);
    } else if (node instanceof ExpresstionStatement) {
        return evalNode(node.expression);
    } else if (node instanceof ReturnStatement) {
        return new ReturnValueThingy(evalNode(node.returnValue));
    } else if (node instanceof IntegerLiteral) {
        return new IntegerThingy(node.value);
    } else if (node instanceof BooleanLiteral) {
        return node.value ? TRUE : FALSE;
    } else if (node instanceof PrefixOperation) {
        return evalPrefixOperation(node);
    } else if (node instanceof InfixOperation) {
        return evalInfixOperation(node);
    } else if (node instanceof IfExpression) {
        return evalIfExpression(node);
    }
    return NULL;
};

const evalAstRoot = (statementArray: Statement[]): Thingy => {
    let result: Thingy = new NullThingy();
    for (const st of statementArray) {
        result = evalNode(st);
        if (result instanceof ReturnValueThingy) {
            return result.value; // unwrap return value
        }
    }
    return result;
};

const evalBlockStatements = (statementArray: Statement[]): Thingy => {
    let result: Thingy = new NullThingy();
    for (const st of statementArray) {
        result = evalNode(st);
        if (result instanceof ReturnValueThingy) {
            return result; // keep wraping return value
        }
    }
    return result;
};

const evalPrefixOperation = (node: PrefixOperation): Thingy => {
    const right = evalNode(node.right);
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
    if (right instanceof IntegerThingy) {
        return new IntegerThingy(-right.value);
    }

    return NULL;
};

/** 中置演算子 */
const evalInfixOperation = (node: InfixOperation): Thingy => {
    const left = evalNode(node.left);
    const right = evalNode(node.right);
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
    if (!(left instanceof IntegerThingy) || !(right instanceof IntegerThingy))
        return NULL;

    switch (operator) {
        case tokens.plus:
            return new IntegerThingy(left.value + right.value);
        case tokens.minus:
            return new IntegerThingy(left.value - right.value);
        case tokens.asterisk:
            return new IntegerThingy(left.value * right.value);
        case tokens.slash:
            return new IntegerThingy(left.value / right.value);
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
    if (left instanceof IntegerThingy && right instanceof IntegerThingy) {
        switch (operator) {
            case tokens.eq:
                return left.value === right.value ? TRUE : FALSE;
            case tokens.notEq:
                return left.value !== right.value ? TRUE : FALSE;
            default:
                return NULL;
        }
    } else if (
        left instanceof BooleanThingy &&
        right instanceof BooleanThingy
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

const evalIfExpression = (node: IfExpression): Thingy => {
    const condition = evalNode(node.conditionExpression);
    if (condition === TRUE) {
        return evalNode(node.consequenceStatement);
    } else if (node.alternativeStatement != null) {
        return evalNode(node.alternativeStatement);
    } else {
        return NULL;
    }
};

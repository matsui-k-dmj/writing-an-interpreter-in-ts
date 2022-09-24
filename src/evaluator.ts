import {
    AstRoot,
    BlockStatement,
    BooleanLiteral,
    CallExpressioon,
    ExpresstionStatement,
    FunctionLiteral,
    Identifier,
    IfExpression,
    InfixOperation,
    IntegerLiteral,
    LetStatement,
    Node,
    PrefixOperation,
    ReturnStatement,
    Statement,
} from 'ast';
import {
    BooleanThingy,
    Environment,
    FunctionThingy,
    IntegerThingy,
    NullThingy,
    ReturnValueThingy,
    Thingy,
} from 'object';
import { tokens } from 'token';
import { parseArgs } from 'util';

const TRUE = new BooleanThingy(true);
const FALSE = new BooleanThingy(false);
const NULL = new NullThingy();

export const evalNode = (node: Node, env: Environment): Thingy => {
    if (node instanceof AstRoot) {
        return evalAstRoot(node.statementArray, env);
    } else if (node instanceof BlockStatement) {
        return evalBlockStatements(node.statementArray, env);
    } else if (node instanceof ExpresstionStatement) {
        return evalNode(node.expression, env);
    } else if (node instanceof LetStatement) {
        const value = evalNode(node.value, env);
        env.set(node.name.value, value);
    } else if (node instanceof ReturnStatement) {
        return new ReturnValueThingy(evalNode(node.returnValue, env));
    } else if (node instanceof IntegerLiteral) {
        return new IntegerThingy(node.value);
    } else if (node instanceof BooleanLiteral) {
        return node.value ? TRUE : FALSE;
    } else if (node instanceof PrefixOperation) {
        return evalPrefixOperation(node, env);
    } else if (node instanceof InfixOperation) {
        return evalInfixOperation(node, env);
    } else if (node instanceof IfExpression) {
        return evalIfExpression(node, env);
    } else if (node instanceof Identifier) {
        return evalIdentifier(node, env);
    } else if (node instanceof FunctionLiteral) {
        return new FunctionThingy(node, env);
    } else if (node instanceof CallExpressioon) {
        return evalCall(node, env);
    }
    return NULL;
};

const evalAstRoot = (statementArray: Statement[], env: Environment): Thingy => {
    let result: Thingy = new NullThingy();
    for (const st of statementArray) {
        result = evalNode(st, env);
        if (result instanceof ReturnValueThingy) {
            return result.value; // unwrap return value
        }
    }
    return result;
};

const evalBlockStatements = (
    statementArray: Statement[],
    env: Environment
): Thingy => {
    let result: Thingy = new NullThingy();
    for (const st of statementArray) {
        result = evalNode(st, env);
        if (result instanceof ReturnValueThingy) {
            return result; // keep wraping return value
        }
    }
    return result;
};

const evalPrefixOperation = (
    node: PrefixOperation,
    env: Environment
): Thingy => {
    const right = evalNode(node.right, env);
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
const evalInfixOperation = (node: InfixOperation, env: Environment): Thingy => {
    const left = evalNode(node.left, env);
    const right = evalNode(node.right, env);
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

const evalIfExpression = (node: IfExpression, env: Environment): Thingy => {
    const condition = evalNode(node.conditionExpression, env);
    if (condition === TRUE) {
        return evalNode(node.consequenceStatement, env);
    } else if (node.alternativeStatement != null) {
        return evalNode(node.alternativeStatement, env);
    } else {
        return NULL;
    }
};

const evalIdentifier = (node: Identifier, env: Environment): Thingy => {
    const value = env.get(node.value);
    if (value == null) {
        return NULL;
    }
    return value;
};

const evalCall = (node: CallExpressioon, env: Environment): Thingy => {
    const functionThingy = evalNode(node.functionExpression, env);
    if (!(functionThingy instanceof FunctionThingy)) return NULL;

    // 現在の定義ではなく、関数が定義されたときの環境を外部環境として関数の中に渡す. (レキシカルクロージャ)
    const innerEnv = new Environment(functionThingy.env);

    // 引数を評価して関数内部の環境に渡す
    for (const [
        iParam,
        paramIdent,
    ] of functionThingy.functionLiteral.parameterArray.entries()) {
        const paramThingy = evalNode(node.parameterArray[iParam], env);
        innerEnv.set(paramIdent.value, paramThingy);
    }

    const result = evalBlockStatements(
        functionThingy.functionLiteral.body.statementArray,
        innerEnv
    );

    // 関数の外がreturnで終了しないようにunwrapする
    if (result instanceof ReturnValueThingy) {
        return result.value; // unwrap return value
    }

    return result;
};

import {
    AstRoot,
    ExpresstionStatement,
    IntegerLiteral,
    Node,
    Statement,
} from 'ast';
import { IntegerMonkey, Thingy } from 'object';

export const evalMonkey = (node: Node): Thingy | null => {
    if (node instanceof AstRoot) {
        return evalStatements(node.statementArray);
    } else if (node instanceof ExpresstionStatement) {
        return evalMonkey(node.expression);
    } else if (node instanceof IntegerLiteral) {
        return new IntegerMonkey(node.value);
    }
    return null;
};

const evalStatements = (statementArray: Statement[]): Thingy | null => {
    let result: Thingy | null = null;
    for (const st of statementArray) {
        result = evalMonkey(st);
    }
    return result;
};

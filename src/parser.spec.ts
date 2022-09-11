import { expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import {
    ExpresstionStatement,
    Identifier,
    IntegerLiteral,
    LetStatement,
    ReturnStatement,
} from 'ast';

const checkParseErrors = (parser: Parser) => {
    if (parser.errors.length > 0) {
        throw new Error(parser.errors.join('\n'));
    }
};

it.concurrent('let statements', () => {
    const input = `
    let x = 5;
    let y = 10;
    let foobar = 838383;
    `;
    const answers = ['x', 'y', 'foobar'] as const;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    for (const i of answers.keys()) {
        const statement = astRoot.statementArray[i];
        if (statement instanceof LetStatement) {
            expect(statement.name.token.literal).toBe(answers[i]);
        } else {
            throw new Error(`${statement} is not a let statement`);
        }
    }
});

it.concurrent('return statements', () => {
    const input = `
    return 5;
    return 10;
    return 1999;
    `;
    const numStatements = 3;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    for (const i of Array.from({ length: numStatements }).keys()) {
        const statement = astRoot.statementArray[i];
        if (!(statement instanceof ReturnStatement)) {
            throw new Error(`${statement} is not a return statement`);
        }
    }
});

it.concurrent('identifier expression', () => {
    const input = 'foobar;';
    const numStatement = 1;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    expect(astRoot.statementArray.length).toBe(numStatement);

    const statement = astRoot.statementArray[0];
    if (!(statement instanceof ExpresstionStatement)) throw new Error();
    if (!(statement.expression instanceof Identifier)) throw new Error();

    expect(statement.expression.value).toBe('foobar');
});

it.concurrent('integer literal expression', () => {
    const input = '5;';
    const numStatement = 1;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    expect(astRoot.statementArray.length).toBe(numStatement);

    const statement = astRoot.statementArray[0];
    if (!(statement instanceof ExpresstionStatement)) throw new Error();
    if (!(statement.expression instanceof IntegerLiteral)) throw new Error();

    expect(statement.expression.value).toBe(5);
});

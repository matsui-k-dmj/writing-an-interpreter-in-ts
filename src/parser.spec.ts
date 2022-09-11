import { assert, expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import {
    Expression,
    ExpresstionStatement,
    Identifier,
    IntegerLiteral,
    LetStatement,
    PrefixOperation,
    ReturnStatement,
} from 'ast';
import { tokens } from 'token';

const checkParseErrors = (parser: Parser) => {
    if (parser.errors.length > 0) {
        throw new Error(parser.errors.join('\n'));
    }
};

const checkIntegerLiteral = (expression: Expression, expectedNum: number) => {
    assert(expression instanceof IntegerLiteral);
    expect(expression.value).toBe(expectedNum);
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
        assert(statement instanceof LetStatement);
        expect(statement.name.token.literal).toBe(answers[i]);
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
        assert(statement instanceof ReturnStatement);
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
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof Identifier);
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
    assert(statement instanceof ExpresstionStatement);
    checkIntegerLiteral(statement.expression, 5);
});

it.concurrent('prefix operation expression', () => {
    const input = `
    !5;
    -10;
    !!5;
    `;
    const numStatement = 3;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    expect(astRoot.statementArray.length).toBe(numStatement);

    //\ !5
    let statement = astRoot.statementArray[0];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof PrefixOperation);
    expect(statement.expression.operator).toBe(tokens.bang);
    checkIntegerLiteral(statement.expression.right, 5);

    // -10
    statement = astRoot.statementArray[1];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof PrefixOperation);
    expect(statement.expression.operator).toBe(tokens.minus);
    checkIntegerLiteral(statement.expression.right, 10);

    //\ !!5
    statement = astRoot.statementArray[2];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof PrefixOperation);
    expect(statement.expression.operator).toBe(tokens.bang);

    const rightExpression = statement.expression.right;
    assert(rightExpression instanceof PrefixOperation);
    expect(rightExpression.operator).toBe(tokens.bang);

    checkIntegerLiteral(rightExpression.right, 5);
});
import { assert, expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import {
    BlockStatement,
    BooleanLiteral,
    CallExpressioon,
    Expression,
    ExpresstionStatement,
    FunctionLiteral,
    Identifier,
    IfExpression,
    InfixOperation,
    IntegerLiteral,
    LetStatement,
    PrefixOperation,
    ReturnStatement,
} from 'ast';
import { tokens } from 'token';

export const checkParseErrors = (parser: Parser) => {
    if (parser.errors.length > 0) {
        throw new Error(parser.errors.join('\n'));
    }
};

const checkIntegerLiteral = (expression: Expression, answer: number) => {
    assert(expression instanceof IntegerLiteral);
    expect(expression.value).toBe(answer);
};

const checkBooleanLiteral = (expression: Expression, answer: boolean) => {
    assert(expression instanceof BooleanLiteral);
    expect(expression.value).toBe(answer);
};

it.concurrent('let statements', () => {
    const input = `
    let x = 5;
    let y = 10;
    let foobar = 1999;
    `;
    const answers = ['x', 'y', 'foobar'] as const;
    const values = [5, 10, 1999];

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    for (const i of answers.keys()) {
        const statement = astRoot.statementArray[i];
        assert(statement instanceof LetStatement);
        expect(statement.name.token.literal).toBe(answers[i]);
        checkIntegerLiteral(statement.value, values[i]);
    }
});

it.concurrent('return statements', () => {
    const input = `
    return 5;
    return 10;
    return 1999;
    `;
    const numStatements = 3;
    const returnValues = [5, 10, 1999];

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    for (const i of Array.from({ length: numStatements }).keys()) {
        const statement = astRoot.statementArray[i];
        assert(statement instanceof ReturnStatement);

        checkIntegerLiteral(statement.returnValue, returnValues[i]);
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

it.concurrent('boolean literal expression', () => {
    const input = 'true; false;';
    const numStatement = 2;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    expect(astRoot.statementArray.length).toBe(numStatement);

    let statement = astRoot.statementArray[0];
    assert(statement instanceof ExpresstionStatement);
    checkBooleanLiteral(statement.expression, true);

    statement = astRoot.statementArray[1];
    assert(statement instanceof ExpresstionStatement);
    checkBooleanLiteral(statement.expression, false);
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

it.concurrent('infix operation expression', () => {
    const input = `
    5 + 5;
    5 - 5;
    5 * 5;
    5 / 5;
    5 > 5;
    5 < 5;
    5 == 5;
    5 != 5;
    `;
    const numStatement = 8;

    const expectedOperators = [
        tokens.plus,
        tokens.minus,
        tokens.asterisk,
        tokens.slash,
        tokens.greaterThan,
        tokens.lessThan,
        tokens.eq,
        tokens.notEq,
    ];

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);

    expect(astRoot.statementArray.length).toBe(numStatement);

    for (const [i, statement] of astRoot.statementArray.entries()) {
        assert(statement instanceof ExpresstionStatement);
        assert(statement.expression instanceof InfixOperation);

        expect(statement.expression.operator).toBe(expectedOperators[i]);
        checkIntegerLiteral(statement.expression.left, 5);
        checkIntegerLiteral(statement.expression.right, 5);
    }
});

it.concurrent('precedence', () => {
    const test = [
        ['-a * b', '((-a) * b)'],
        ['!-a', '(!(-a))'],
        ['a + b + c', '((a + b) + c)'],
        ['a + b * c', '(a + (b * c))'],
        ['5 > 4 == 3 / 2', '((5 > 4) == (3 / 2))'],
        ['5 > 4 != 1 - 3 / 2', '((5 > 4) != (1 - (3 / 2)))'],
        ['true != !false', '(true != (!false))'],
    ];
    for (const [input, expected] of test) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const astRoot = parser.parseProgram();
        checkParseErrors(parser);
        expect(astRoot.statementArray.length).toBe(1);
        let statement = astRoot.statementArray[0];
        assert(statement instanceof ExpresstionStatement);
        expect(statement.expression.print()).toBe(expected);
    }
});

it.concurrent('precedence groups', () => {
    const test = [
        ['-(a * b)', '(-(a * b))'],
        ['a + (b + c)', '(a + (b + c))'],
        ['(a + b) * c', '((a + b) * c)'],
        ['5 > (4 == 3) / 2', '(5 > ((4 == 3) / 2))'],
        ['5 > 4 != (1 - 3) / 2', '((5 > 4) != ((1 - 3) / 2))'],
        ['!(true != !false)', '(!(true != (!false)))'],
        ['1 * ((2 + 3 * 5) * (4 - 5))', '(1 * ((2 + (3 * 5)) * (4 - 5)))'],
    ];
    for (const [input, expected] of test) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const astRoot = parser.parseProgram();
        checkParseErrors(parser);
        expect(astRoot.statementArray.length).toBe(1);
        let statement = astRoot.statementArray[0];
        assert(statement instanceof ExpresstionStatement);
        expect(statement.expression.print()).toBe(expected);
    }
});

it.concurrent('precedence calls', () => {
    const test = [
        ['a + add(b * c) + d', '((a + add((b * c))) + d)'],
        [
            'add(a, b, 1, 2 * 3, 4 + 5, add(6, 1 + 7 * 8))',
            'add(a, b, 1, (2 * 3), (4 + 5), add(6, (1 + (7 * 8))))',
        ],
    ];
    for (const [input, expected] of test) {
        const lexer = new Lexer(input);
        const parser = new Parser(lexer);
        const astRoot = parser.parseProgram();
        checkParseErrors(parser);
        expect(astRoot.statementArray.length).toBe(1);
        let statement = astRoot.statementArray[0];
        assert(statement instanceof ExpresstionStatement);
        expect(statement.expression.print()).toBe(expected);
    }
});

it.concurrent('group is not closed', () => {
    const input = 'c + (a + b';
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    parser.parseProgram();
    expect(parser.errors[0]).toBe('no ) after (a + b)');
});

it.concurrent('if', () => {
    const input = `
        if (x < y) { x }
    `;
    const numStatement = 1;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);

    const statement = astRoot.statementArray[0];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof IfExpression);
    expect(statement.expression.conditionExpression.print()).toBe('(x < y)');
    expect(
        statement.expression.consequenceStatement.statementArray[0].tokenLiteral()
    ).toBe('x');
    expect(statement.expression.alternativeStatement).toBeNull();
});

it.concurrent('if else ', () => {
    const input = `
        if (x < y) { 
            return x;
        } else { 
            y 
        }
    `;
    const numStatement = 1;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);

    const statement = astRoot.statementArray[0];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof IfExpression);
    expect(statement.expression.conditionExpression.print()).toBe('(x < y)');
    assert(
        statement.expression.consequenceStatement.statementArray[0] instanceof
            ReturnStatement
    );
    assert(statement.expression.alternativeStatement != null);
    expect(
        statement.expression.alternativeStatement.statementArray.length
    ).toBe(1);
    assert(
        statement.expression.alternativeStatement.statementArray[0] instanceof
            ExpresstionStatement
    );
    expect(
        statement.expression.alternativeStatement.statementArray[0].expression.print()
    ).toBe('y');
});

it.concurrent('function literal', () => {
    const input = `
        fn (x, y) {x + y;}
    `;
    const numStatement = 1;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);

    const statement = astRoot.statementArray[0];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof FunctionLiteral);

    expect(statement.expression.parameterArray.length).toBe(2);
    expect(statement.expression.parameterArray[0].print()).toBe('x');
    expect(statement.expression.parameterArray[1].print()).toBe('y');

    assert(statement.expression.body instanceof BlockStatement);
    expect(statement.expression.body.statementArray.length).toBe(1);
    expect(statement.expression.body.statementArray[0].print()).toBe('(x + y)');
});

it.concurrent('empty function', () => {
    const input = `
        fn () {}
    `;
    const numStatement = 1;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);

    const statement = astRoot.statementArray[0];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof FunctionLiteral);
    expect(statement.expression.parameterArray.length).toBe(0);

    assert(statement.expression.body instanceof BlockStatement);
    expect(statement.expression.body.statementArray.length).toBe(0);
});

it.concurrent('call expression', () => {
    const input = `
        add(x, y)
    `;
    const numStatement = 1;
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);

    const statement = astRoot.statementArray[0];
    assert(statement instanceof ExpresstionStatement);
    assert(statement.expression instanceof CallExpressioon);
});

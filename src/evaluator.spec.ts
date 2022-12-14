import { assert, expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import { checkParseErrors } from 'parser.spec';
import { evalNode } from 'evaluator';
import {
    BooleanThingy,
    Environment,
    FunctionThingy,
    IntegerThingy,
    NullThingy,
    Thingy,
} from 'object';

const checkEval = (input: string, numStatement: number) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);

    const env = new Environment(null);
    const result = evalNode(astRoot, env);
    assert(result != null);
    return result;
};

const checkInteger = (result: Thingy, answer: number) => {
    assert(result instanceof IntegerThingy, result.inspect());
    expect(result.value).toBe(answer);
};

const checkBoolean = (result: Thingy, answer: boolean) => {
    assert(result instanceof BooleanThingy);
    expect(result.value).toBe(answer);
};

it.concurrent('integer', () => {
    const tests = [
        ['10', 10],
        ['5', 5],
        ['-5', -5],
        ['5 + 5', 10],
        ['5 - 5', 0],
        ['5 * 5', 25],
        ['5 / 5', 1],
        ['-5 + 5', 0],
        ['5 - 5 * 5', -20],
        ['(5 - 5) * 5', 0],
    ] as const;

    for (const [input, answer] of tests) {
        const result = checkEval(input, 1);
        checkInteger(result, answer);
    }
});

it.concurrent('boolean', () => {
    const tests = [
        ['true', true],
        ['false', false],
        ['!true', false],
        ['!false', true],
        ['!!false', false],
        ['!!true', true],
        ['!5', true],
        ['!-5', true],
        ['5 < 10', true],
        ['5 > 10', false],
        ['5 == 10', false],
        ['5 != 10', true],
        ['5 != 5', false],
        ['true == true', true],
        ['true != true', false],
        ['true == false', false],
        ['true != false', true],
        ['(1 + 6) == 7', true],
        ['(1 > 3) == (2 > 5)', true],
    ] as const;

    for (const [input, answer] of tests) {
        const result = checkEval(input, 1);
        checkBoolean(result, answer);
    }
});

it.concurrent('if', () => {
    const tests = [
        ['if(true) {5}', 5],
        ['if(false) {5} else {10}', 10],
        ['if(1 + 2) {5} else {10}', 10],
        ['if ((1 > 3) == (2 > 5)) {5}', 5],
    ] as const;

    for (const [input, answer] of tests) {
        const result = checkEval(input, 1);
        checkInteger(result, answer);
    }
});

it.concurrent('if returns NULL', () => {
    const tests = ['if(false) {5}', 'if(10) {10}'] as const;

    for (const input of tests) {
        const result = checkEval(input, 1);
        assert(result instanceof NullThingy);
    }
});

it.concurrent('return', () => {
    const tests = [
        ['if(true) { return 5; }', 1, 5],
        ['9; return 5; 3 * 4', 3, 5],
        [
            `if(true) {
            if (true) {
                return 5;
            }
            return 10;
        }`,
            1,
            5,
        ],
    ] as const;

    for (const [input, numStatement, answer] of tests) {
        const result = checkEval(input, numStatement);
        checkInteger(result, answer);
    }
});

it.concurrent('let', () => {
    const tests = [
        ['let a = 5; a', 2, 5],
        ['let a = 5; 5 * a', 2, 25],
        ['let a = 5; let b = a; b', 3, 5],
        ['let a = 5; let b = a; a * b', 3, 25],
    ] as const;

    for (const [input, numStatement, answer] of tests) {
        const result = checkEval(input, numStatement);
        checkInteger(result, answer);
    }
});

it.concurrent('function thingy', () => {
    const tests = [['fn(x){x};', 1]] as const;

    for (const [input, numStatement] of tests) {
        const result = checkEval(input, numStatement);
        assert(result instanceof FunctionThingy);
    }
});

it.concurrent('fn', () => {
    const tests = [
        ['let a = fn(x){x}; a(5)', 2, 5],
        ['let a = fn(x){ return x; }; a(5)', 2, 5],
        ['let x = 5; let a = fn(){x}; a()', 3, 5],
        [
            'let a = fn(x){x + 1}; let b = fn(x, increment){increment(x)}; b(10, a)',
            3,
            11,
        ],
    ] as const;

    for (const [input, numStatement, answer] of tests) {
        const result = checkEval(input, numStatement);
        checkInteger(result, answer);
    }
});

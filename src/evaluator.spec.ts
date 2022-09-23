import { assert, expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import { checkParseErrors } from 'parser.spec';
import { evalNode } from 'evaluator';
import { BooleanThingy, IntegerThingy, NullThingy, Thingy } from 'object';

const checkEval = (input: string, numStatement: number) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);
    const result = evalNode(astRoot);
    assert(result != null);
    return result;
};

const checkInteger = (result: Thingy, answer: number) => {
    assert(result instanceof IntegerThingy);
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

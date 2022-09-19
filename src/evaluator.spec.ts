import { assert, expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import { checkParseErrors } from 'parser.spec';
import { evalMonkey } from 'evaluator';
import { BooleanMonkey, IntegerMonkey, Thingy } from 'object';

const checkEval = (input: string, numStatement: number) => {
    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();
    checkParseErrors(parser);
    expect(astRoot.statementArray.length).toBe(numStatement);
    const result = evalMonkey(astRoot);
    assert(result != null);
    return result;
};

const checkInteger = (result: Thingy, answer: number) => {
    assert(result instanceof IntegerMonkey);
    expect(result.value).toBe(answer);
};

const checkBoolean = (result: Thingy, answer: boolean) => {
    assert(result instanceof BooleanMonkey);
    expect(result.value).toBe(answer);
};

it.concurrent('integer', () => {
    const tests = [
        ['10', 10],
        ['5', 5],
        ['-5', -5],
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
    ] as const;

    for (const [input, answer] of tests) {
        const result = checkEval(input, 1);
        checkBoolean(result, answer);
    }
});

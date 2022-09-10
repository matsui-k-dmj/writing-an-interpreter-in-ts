import { expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import { LetStatement, ReturnStatement } from 'ast';

it('let statements', () => {
    const input = `
    let x = 5;
    let y = 10;
    let foobar = 838383;
    `;
    const answers = ['x', 'y', 'foobar'] as const;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();

    if (parser.errors.length > 0) {
        throw new Error(parser.errors.join('\n'));
    }

    for (const i of answers.keys()) {
        const statement = astRoot.statementArray[i];
        if (statement instanceof LetStatement) {
            expect(statement.name.token.literal).toBe(answers[i]);
        } else {
            throw new Error(`${statement} is not a let statement`);
        }
    }
});

it('return statements', () => {
    const input = `
    return 5;
    return 10;
    return 1999;
    `;
    const numStatements = 3;

    const lexer = new Lexer(input);
    const parser = new Parser(lexer);
    const astRoot = parser.parseProgram();

    if (parser.errors.length > 0) {
        throw new Error(parser.errors.join('\n'));
    }

    for (const i of Array.from({ length: numStatements }).keys()) {
        const statement = astRoot.statementArray[i];
        if (!(statement instanceof ReturnStatement)) {
            throw new Error(`${statement} is not a return statement`);
        }
    }
});

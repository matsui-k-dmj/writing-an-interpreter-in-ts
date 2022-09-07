import { expect, it } from 'vitest';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import { LetStatement } from 'ast';

it('let statements', () => {
    const input = `
    let x = 5;
    let y = 10;
    let foobar = 838383;
    `;
    const answers = ['x', 'y', 'foobar'] as const;

    const lexer = new Lexer(input);
    const astRoot = new Parser(lexer).parseProgram();

    for (const i of answers.keys()) {
        const statement = astRoot.statementArray[i];
        if (statement instanceof LetStatement) {
            expect(statement.name.token.literal).toBe(answers[i]);
        } else {
            throw new Error(`${statement} is not a let statement`);
        }
    }
});

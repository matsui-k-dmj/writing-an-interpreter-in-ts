import { expect, it } from 'vitest';
import { tokens, Token } from 'token';
import { Lexer } from 'lexer';

it('nextToken non-letter-character', () => {
    const input = '=+(){},;';
    const _answers = [
        [tokens.assign, '='],
        [tokens.plus, '+'],
        [tokens.leftParen, '('],
        [tokens.rightParen, ')'],
        [tokens.leftBrace, '{'],
        [tokens.rightBrace, '}'],
        [tokens.comma, ','],
        [tokens.semicolon, ';'],
    ] as const;
    const answers: Token[] = _answers.map((tuple) => ({
        type: tuple[0],
        literal: tuple[1],
    }));
    const lexer = new Lexer(input);
    for (const expectedToken of answers) {
        const token = lexer.nextToken();
        expect(token).toStrictEqual(expectedToken);
    }
    const token = lexer.nextToken();
    expect(token).toStrictEqual({ type: tokens.EOF, literal: '' });
});

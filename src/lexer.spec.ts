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
        const token = lexer.goNextToken();
        expect(token).toStrictEqual(expectedToken);
    }
    const token = lexer.goNextToken();
    expect(token).toStrictEqual({ type: tokens.EOF, literal: '' });
});

it('nextToken', () => {
    const input = `let five = 5;
let ten = 10;

let add = fn(x, y) {
    x + y;
};

let result = add(five + ten);
!-/*5;
5 < 10 > 5;

if (5 < 10) {
    return true;
} else {
    return false;
}

10 == 10;
10 != 9;
`;
    const _answers = [
        [tokens.let, 'let'],
        [tokens.ident, 'five'],
        [tokens.assign, '='],
        [tokens.int, '5'],
        [tokens.semicolon, ';'],
        [tokens.let, 'let'],
        [tokens.ident, 'ten'],
        [tokens.assign, '='],
        [tokens.int, '10'],
        [tokens.semicolon, ';'],
        [tokens.let, 'let'],
        [tokens.ident, 'add'],
        [tokens.assign, '='],
        [tokens.function, 'fn'],
        [tokens.leftParen, '('],
        [tokens.ident, 'x'],
        [tokens.comma, ','],
        [tokens.ident, 'y'],
        [tokens.rightParen, ')'],
        [tokens.leftBrace, '{'],
        [tokens.ident, 'x'],
        [tokens.plus, '+'],
        [tokens.ident, 'y'],
        [tokens.semicolon, ';'],
        [tokens.rightBrace, '}'],
        [tokens.semicolon, ';'],
        [tokens.let, 'let'],
        [tokens.ident, 'result'],
        [tokens.assign, '='],
        [tokens.ident, 'add'],
        [tokens.leftParen, '('],
        [tokens.ident, 'five'],
        [tokens.plus, '+'],
        [tokens.ident, 'ten'],
        [tokens.rightParen, ')'],
        [tokens.semicolon, ';'],
        [tokens.bang, '!'],
        [tokens.minus, tokens.minus],
        [tokens.slash, tokens.slash],
        [tokens.asterisk, tokens.asterisk],
        [tokens.int, '5'],
        [tokens.semicolon, tokens.semicolon],
        [tokens.int, '5'],
        [tokens.lessThan, tokens.lessThan],
        [tokens.int, '10'],
        [tokens.greaterThan, tokens.greaterThan],
        [tokens.int, '5'],
        [tokens.semicolon, tokens.semicolon],
        [tokens.if, tokens.if],
        [tokens.leftParen, tokens.leftParen],
        [tokens.int, '5'],
        [tokens.lessThan, tokens.lessThan],
        [tokens.int, '10'],
        [tokens.rightParen, tokens.rightParen],
        [tokens.leftBrace, tokens.leftBrace],
        [tokens.return, tokens.return],
        [tokens.true, tokens.true],
        [tokens.semicolon, tokens.semicolon],
        [tokens.rightBrace, tokens.rightBrace],
        [tokens.else, tokens.else],
        [tokens.leftBrace, tokens.leftBrace],
        [tokens.return, tokens.return],
        [tokens.false, tokens.false],
        [tokens.semicolon, tokens.semicolon],
        [tokens.rightBrace, tokens.rightBrace],
        [tokens.int, '10'],
        [tokens.eq, tokens.eq],
        [tokens.int, '10'],
        [tokens.semicolon, tokens.semicolon],
        [tokens.int, '10'],
        [tokens.notEq, tokens.notEq],
        [tokens.int, '9'],
        [tokens.semicolon, tokens.semicolon],
        [tokens.EOF, ''],
    ] as const;
    const answers: Token[] = _answers.map((tuple) => ({
        type: tuple[0],
        literal: tuple[1],
    }));
    const lexer = new Lexer(input);
    for (const expectedToken of answers) {
        const token = lexer.goNextToken();
        expect(token).toStrictEqual(expectedToken);
    }
    const token = lexer.goNextToken();
    expect(token).toStrictEqual({ type: tokens.EOF, literal: '' });
});

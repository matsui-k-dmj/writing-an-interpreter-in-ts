import { lookupIdent, Token, tokens } from 'token';

/** 字句解析マシーン */
export class Lexer {
    constructor(
        public input: string,
        /** input 中の現在の index */
        public position: number = 0,
        /** 次に読む index */
        public readPosition: number = 0,
        /** 現在検査中の文字 */
        public ch: string | null = null
    ) {
        this.readChar();
    }

    /** 1文字進む */
    readChar = () => {
        if (this.readPosition >= this.input.length) {
            this.ch = null;
        } else {
            this.ch = this.input[this.readPosition];
        }
        this.position = this.readPosition;
        this.readPosition += 1;
    };

    /** readPositionから読むだけでpositionは進めない */
    peekChar = () => {
        if (this.readPosition >= this.input.length) {
            return null;
        } else {
            return this.input[this.readPosition];
        }
    };

    /** 1単語読む。keyworkかidentifierかは分からない */
    readWord = () => {
        const position = this.position;
        while (isLetter(this.ch)) {
            this.readChar();
        }
        // falseになったときにreadCharせずここにくるので、そのときのpositionは含まなくていい
        return this.input.slice(position, this.position);
    };

    /** 1整数読む。 */
    readInteger = () => {
        const position = this.position;
        while (isCharNumber(this.ch)) {
            this.readChar();
        }
        // falseになったときにreadCharせずここにくるので、そのときのpositionは含まなくていい
        return this.input.slice(position, this.position);
    };

    skipWhitespeces = () => {
        while (this.ch != null && [' ', '\t', '\n', '\r'].includes(this.ch)) {
            this.readChar();
        }
    };

    goNextToken = () => {
        this.skipWhitespeces();

        let tok: Token;
        switch (this.ch) {
            case '=':
                if (this.peekChar() === '=') {
                    this.readChar();
                    tok = {
                        type: tokens.eq,
                        literal: '==',
                    };
                    break;
                } else {
                    tok = { type: tokens.assign, literal: this.ch };
                    break;
                }
            case '!':
                if (this.peekChar() === '=') {
                    this.readChar();
                    tok = { type: tokens.notEq, literal: '!=' };
                    break;
                } else {
                    tok = { type: tokens.bang, literal: this.ch };
                    break;
                }
            case tokens.semicolon:
                tok = { type: tokens.semicolon, literal: this.ch };
                break;
            case tokens.leftParen:
                tok = { type: tokens.leftParen, literal: this.ch };
                break;
            case tokens.rightParen:
                tok = { type: tokens.rightParen, literal: this.ch };
                break;
            case tokens.comma:
                tok = { type: tokens.comma, literal: this.ch };
                break;
            case tokens.plus:
                tok = { type: tokens.plus, literal: this.ch };
                break;
            case tokens.leftBrace:
                tok = { type: tokens.leftBrace, literal: this.ch };
                break;
            case tokens.rightBrace:
                tok = { type: tokens.rightBrace, literal: this.ch };
                break;
            case tokens.minus:
                tok = { type: tokens.minus, literal: this.ch };
                break;
            case tokens.rightBrace:
                tok = { type: tokens.rightBrace, literal: this.ch };
                break;

            case tokens.asterisk:
                tok = { type: tokens.asterisk, literal: this.ch };
                break;
            case tokens.slash:
                tok = { type: tokens.slash, literal: this.ch };
                break;
            case tokens.lessThan:
                tok = { type: tokens.lessThan, literal: this.ch };
                break;
            case tokens.greaterThan:
                tok = { type: tokens.greaterThan, literal: this.ch };
                break;
            case null:
                tok = { type: tokens.EOF, literal: '' };
                break;
            default:
                if (isLetter(this.ch)) {
                    const literal = this.readWord();
                    const type = lookupIdent(literal);
                    tok = { type, literal };
                    return tok;
                } else if (isCharNumber(this.ch)) {
                    tok = { type: tokens.int, literal: this.readInteger() };
                    return tok;
                } else {
                    tok = { type: tokens.ILLEGAL, literal: this.ch };
                }
        }
        this.readChar();
        return tok;
    };
}

const isLetter = (ch: string | null) => {
    return ch != null && ch.length === 1 && (/[a-zA-z]/.test(ch) || ch === '_');
};

function isCharNumber(c: string | null) {
    return c != null && c >= '0' && c <= '9';
}

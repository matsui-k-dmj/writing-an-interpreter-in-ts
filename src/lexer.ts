import { Token, tokens } from 'token';

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

    nextToken = () => {
        let tok: Token;
        switch (this.ch) {
            case tokens.assign:
                tok = { type: tokens.assign, literal: this.ch };
                break;
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
            case null:
                tok = { type: tokens.EOF, literal: '' };
                break;
            default:
                tok = { type: tokens.ILLEGAL, literal: '' };
                break;
        }
        this.readChar();
        return tok;
    };
}

import { AstRoot, Identifier, LetStatement, Statement } from 'ast';
import { Lexer } from 'lexer';
import { Token, tokens } from 'token';

/** 構文解析マシーン */
export class Parser {
    currentToken: Token = { type: tokens.ILLEGAL, literal: '' };
    peekToken: Token = { type: tokens.ILLEGAL, literal: '' };
    constructor(public lexer: Lexer) {
        // 二つ進めるとcurrentTokenとpeekTokenが読まれる
        this.goNextToken();
        this.goNextToken();
    }

    /**
     * goNextTokenの中までflow analysisしてくれないことで currentTokenの型がnarrowされ過ぎる場合に使う
     * https://github.com/Microsoft/TypeScript/issues/9998#issuecomment-235963457
     */
    getCurrentToken = () => this.currentToken;
    getPeekToken = () => this.peekToken;

    goNextToken = () => {
        this.currentToken = this.peekToken;
        this.peekToken = this.lexer.goNextToken();
    };

    /** プログラム全体をパース */
    parseProgram: () => AstRoot = () => {
        const astRoot = new AstRoot([]);
        while (this.currentToken.type !== tokens.EOF) {
            const statement = this.parseStatement();
            if (statement != null) {
                astRoot.statementArray.push(statement);
            }
            this.goNextToken();
        }
        return astRoot;
    };

    /** 文の最初にあるトークンの場所から初めて文をパースする */
    parseStatement: () => Statement | null = () => {
        switch (this.currentToken.type) {
            case tokens.let:
                return this.parseLetStatement();

            default:
                return null;
        }
    };

    /**
     * currentToken = let から let文をパースする
     * let, ident, assign, expression, semicolon
     */
    parseLetStatement: () => LetStatement | null = () => {
        // let -> ident
        if (this.getPeekToken().type !== tokens.ident) return null;
        this.goNextToken();

        const ident = new Identifier(
            {
                type: tokens.ident,
                literal: this.currentToken.literal,
            },
            this.currentToken.literal
        );

        // ident -> assign
        if (this.getPeekToken().type !== tokens.assign) return null;
        this.goNextToken();

        // TODO: parse expression
        while (this.getCurrentToken().type !== tokens.semicolon) {
            this.goNextToken();
        }

        return new LetStatement(
            { type: tokens.let, literal: tokens.let },
            ident,
            {
                nodeType: 'expression',
                tokenLiteral: () => '',
            }
        );
    };
}

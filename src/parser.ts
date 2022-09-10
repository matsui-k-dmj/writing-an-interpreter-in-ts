import {
    AstRoot,
    Identifier,
    LetStatement,
    ReturnStatement,
    Statement,
} from 'ast';
import { Lexer } from 'lexer';
import { Token, tokens } from 'token';

/** 構文解析マシーン */
export class Parser {
    currentToken: Token = { type: tokens.ILLEGAL, literal: '' };
    peekToken: Token = { type: tokens.ILLEGAL, literal: '' };
    /** デバックとテスト用 */
    errors: string[] = [];
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
    parseProgram = (): AstRoot => {
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
    parseStatement = (): Statement | null => {
        switch (this.currentToken.type) {
            case tokens.let:
                return this.parseLetStatement();
            case tokens.return:
                return this.parseReturnStatement();
            default:
                return null;
        }
    };

    /** 次のトークンが特定のタイプなら進む */
    expectPeekGoNext = (tokenType: Token['type']) => {
        if (this.getPeekToken().type === tokenType) {
            this.goNextToken();
            return true;
        } else {
            this.errors.push(
                `expect ${tokenType}, get ${
                    this.getPeekToken().literal
                } instead. current token is ${this.getCurrentToken().literal}`
            );
            return false;
        }
    };

    /**
     * currentToken = let から let文をパースする
     * let, ident, assign, expression, semicolon
     */
    parseLetStatement = (): LetStatement | null => {
        // let -> ident
        if (!this.expectPeekGoNext(tokens.ident)) return null;

        const ident = new Identifier(
            {
                type: tokens.ident,
                literal: this.currentToken.literal,
            },
            this.currentToken.literal
        );

        // ident -> assign
        if (!this.expectPeekGoNext(tokens.assign)) return null;

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

    /**
     * currentToken = return から return文をパースする
     * return, expression, semicolon
     */
    parseReturnStatement = (): ReturnStatement | null => {
        this.goNextToken();
        // TODO: parse expression
        while (this.getCurrentToken().type !== tokens.semicolon) {
            this.goNextToken();
        }
        return new ReturnStatement(
            {
                type: tokens.return,
                literal: tokens.return,
            },
            {
                nodeType: 'expression',
                tokenLiteral: () => '',
            }
        );
    };
}

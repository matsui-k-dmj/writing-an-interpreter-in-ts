import {
    AstRoot,
    BooleanLiteral,
    Expression,
    ExpresstionStatement,
    Identifier,
    InfixOperation,
    IntegerLiteral,
    LetStatement,
    PrefixOperation,
    ReturnStatement,
    Statement,
} from 'ast';
import { Lexer } from 'lexer';
import { Token, tokens, TokenType } from 'token';

/** 前置構文解析関数 */
type PrefixParse = () => Expression | null;

/** 演算子の優先順位。順番はindexOfで取る */
const precedenceOrder = [
    'lowest',
    'equals',
    'lessGreater',
    'sum',
    'product',
    'prefix',
    'call',
] as const;

const operationPrecedences = new Map<TokenType, number>([
    [tokens.eq, precedenceOrder.indexOf('equals')],
    [tokens.notEq, precedenceOrder.indexOf('equals')],
    [tokens.lessThan, precedenceOrder.indexOf('lessGreater')],
    [tokens.greaterThan, precedenceOrder.indexOf('lessGreater')],
    [tokens.plus, precedenceOrder.indexOf('sum')],
    [tokens.minus, precedenceOrder.indexOf('sum')],
    [tokens.slash, precedenceOrder.indexOf('product')],
    [tokens.asterisk, precedenceOrder.indexOf('product')],
]);

const getPrecedence = (type: TokenType): number => {
    return operationPrecedences.get(type) ?? precedenceOrder.indexOf('lowest');
};

/** 構文解析マシーン */
export class Parser {
    currentToken: Token = { type: tokens.ILLEGAL, literal: '' };
    peekToken: Token = { type: tokens.ILLEGAL, literal: '' };
    /** デバックとテスト用 */
    errors: string[] = [];

    /** 比較のためにどっちも使ってみる */
    prefixParseFunctions: Map<TokenType, PrefixParse>;

    constructor(public lexer: Lexer) {
        // 二つ進めるとcurrentTokenとpeekTokenが読まれる
        this.goNextToken();
        this.goNextToken();

        this.prefixParseFunctions = new Map([
            [tokens.ident, this.parseIdentifier],
            [tokens.int, this.parseIntegerLiteral],
            [tokens.bang, this.parsePrefixOperation],
            [tokens.minus, this.parsePrefixOperation],
            [tokens.true, this.parseBooleanLiteral],
            [tokens.false, this.parseBooleanLiteral],
        ]);
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
            // parseStatementでcurrentがsemicolonで終わるか、セミコロンが無い式の最後のトークンになってる
            this.goNextToken(); // currentは次の文の先頭のトークン
        }
        return astRoot;
    };

    /**
     * 文の最初にあるトークンの場所から初めて文をパースする
     * 各パース関数が終わったときには currentがsemicolonになるようにしている。
     * 例外的に式の最後のセミコロンがない場合は式の最後のトークンになってる
     * */
    parseStatement = (): Statement | null => {
        switch (this.currentToken.type) {
            case tokens.let:
                return this.parseLetStatement();
            case tokens.return:
                return this.parseReturnStatement();
            default:
                return this.parseExpressionStatement();
        }
    };

    /** 次のトークンが特定のタイプなら進む */
    expectPeekGoNext = (tokenType: TokenType) => {
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
        // currentはsemicolon

        return new LetStatement(
            { type: tokens.let, literal: tokens.let },
            ident,
            {
                nodeType: 'expression',
                tokenLiteral: () => '',
                print: () => '',
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
        // currentはsemicolon

        return new ReturnStatement(
            {
                type: tokens.return,
                literal: tokens.return,
            },
            {
                nodeType: 'expression',
                tokenLiteral: () => '',
                print: () => '',
            }
        );
    };

    /**
     * currentTokenが他の文(let, return)以外のときに式をパースする
     */
    parseExpressionStatement = (): ExpresstionStatement | null => {
        const currentToken = this.getCurrentToken();
        const expression = this.parseExpression(
            precedenceOrder.indexOf('lowest')
        );
        if (expression == null) return null;

        // 式の最後のセミコロンは無視する
        // セミコロンがあったらcurrentはセミコロン
        // なかったら式の最後のトークンになってる
        if (this.getPeekToken().type === tokens.semicolon) {
            this.goNextToken(); // currentはsemicolon
        }
        return new ExpresstionStatement(currentToken, expression);
    };

    /**
     * 現在のトークンに応じて式パース関数を使う
     * 演算子から呼ばれたときには currentが演算子の右側のトークン, precedenceはその演算子の優先順位
     * */
    parseExpression = (precedence: number): Expression | null => {
        const prefixParse = this.prefixParseFunctions.get(
            this.getCurrentToken().type
        );
        if (prefixParse == null) {
            this.errors.push(
                `No prefixParse function for ${this.getCurrentToken().type}`
            );
            return null;
        }

        let expression = prefixParse();
        if (expression == null) return null;

        while (
            this.getPeekToken().type !== tokens.semicolon &&
            precedence < getPrecedence(this.getPeekToken().type)
        ) {
            // 次の中置演算子よりも優先順位が低い場合は自分(式)をその中置演算子に渡す
            this.goNextToken(); // currentは次の中置演算子
            expression = this.parseInfixExpression(expression);
            if (expression == null) return expression;
        }

        return expression;
    };

    /** identトークンから識別子式のパース */
    parseIdentifier = (): Expression => {
        return new Identifier(
            { type: 'ident', literal: this.currentToken.literal },
            this.currentToken.literal
        );
    };

    /** intトークンから整数リテラル式のパース */
    parseIntegerLiteral = (): Expression | null => {
        const num = Number(this.currentToken.literal);
        if (Number.isNaN(num)) {
            this.errors.push(`${this.currentToken.literal} is NaN`);
            return null;
        }
        return new IntegerLiteral(
            {
                type: 'int',
                literal: this.currentToken.literal,
            },
            num
        );
    };

    /** true | false トークンからブーリアンリテラル式のパース */
    parseBooleanLiteral = (): Expression | null => {
        return new BooleanLiteral(
            this.currentToken,
            this.currentToken.type === tokens.true
        );
    };

    /** 前置演算子(!か-)からパース */
    parsePrefixOperation = (): Expression | null => {
        const prefixToken = this.currentToken;
        if (
            prefixToken.type !== tokens.bang &&
            prefixToken.type !== tokens.minus
        )
            return null;

        this.goNextToken(); // currentは 演算子の次のトークン
        const rightExpression = this.parseExpression(
            precedenceOrder.indexOf('prefix')
        );
        if (rightExpression == null) return null;
        return new PrefixOperation(
            { type: prefixToken.type, literal: prefixToken.literal },
            prefixToken.type,
            rightExpression
        );
    };

    /** 中置演算子(*など)からパース */
    parseInfixExpression = (leftExpression: Expression): Expression | null => {
        const currentToken = this.getCurrentToken();
        const precedence = getPrecedence(currentToken.type);
        this.goNextToken(); // currentは演算子の次のトークン
        const rightExpression = this.parseExpression(precedence);

        if (rightExpression == null) return null;

        return new InfixOperation(
            currentToken,
            currentToken.literal,
            rightExpression,
            leftExpression
        );
    };
}

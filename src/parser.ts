import {
    AstRoot,
    BlockStatement,
    BooleanLiteral,
    Expression,
    ExpresstionStatement,
    FunctionLiteral,
    Identifier,
    IfExpression,
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

/**
 *  演算子の優先順位
 * enumは一般的には推奨されてないけど、今は順番が必要だからUnion型ではないし、
 * Record<string, number> だと 新しい値を挿入しにくいので、
 * enumを使う
 */
enum PrecedenceOrder {
    Lowest,
    Equals,
    LessGreater,
    Sum,
    Product,
    Prefix,
    Call,
}

/** 中置演算子の優先順位 */
const operationPrecedences = new Map<TokenType, number>([
    [tokens.eq, PrecedenceOrder.Equals],
    [tokens.notEq, PrecedenceOrder.Equals],
    [tokens.lessThan, PrecedenceOrder.LessGreater],
    [tokens.greaterThan, PrecedenceOrder.LessGreater],
    [tokens.plus, PrecedenceOrder.Sum],
    [tokens.minus, PrecedenceOrder.Sum],
    [tokens.slash, PrecedenceOrder.Product],
    [tokens.asterisk, PrecedenceOrder.Product],
]);

const getPrecedence = (type: TokenType): number => {
    return operationPrecedences.get(type) ?? PrecedenceOrder.Lowest;
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
            [tokens.leftParen, this.parseGroupedExpression],
            [tokens.if, this.parseIfExpression],
            [tokens.function, this.parseFunctionLiteral],
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

    /** 無限ループになりそうなとこに置いとく */
    preventInfiniteLoop = () => {
        if (this.currentToken.type === tokens.EOF) {
            throw Error('Unexpected EOF, possibly forgeting ; after statement');
        }
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
            this.preventInfiniteLoop();
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
            this.preventInfiniteLoop();
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
        const expression = this.parseExpression(PrecedenceOrder.Lowest);
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
     * ifとfnの中の文の先頭からパース
     * current が } で終わる
     */
    parseBlockStatement = (): BlockStatement | null => {
        const firstToken = this.currentToken;
        const statementArray: Statement[] = [];
        while (this.currentToken.type !== tokens.rightBrace) {
            this.preventInfiniteLoop();

            const statement = this.parseStatement();
            if (statement != null) {
                statementArray.push(statement);
            }
            // parseStatementでcurrentがsemicolonで終わるか、セミコロンが無い式の最後のトークンになってる
            this.goNextToken(); // currentは次の文の先頭のトークン
        }
        return new BlockStatement(firstToken, statementArray);
    };

    /**
     * 現在のトークンに応じて式パース関数を使う
     * 演算子から呼ばれたときには currentが演算子の右側のトークン, precedenceはその演算子の優先順位
     * セミコロンや ) を含まない式の最後のトークンで終わる
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

        // 次がセミコロンか自分以下の優先順位のトークンに当たると終わる
        // 演算子以外の ) などが次でもLowestなので終わる
        while (
            this.getPeekToken().type !== tokens.semicolon &&
            precedence < getPrecedence(this.getPeekToken().type)
        ) {
            this.preventInfiniteLoop();

            // 次の中置演算子よりも優先順位が低い場合は自分(式)をその中置演算子に渡す
            this.goNextToken(); // currentは次の中置演算子
            expression = this.parseInfixExpression(expression);
            if (expression == null) return expression;
        }

        return expression;
    };

    /** identトークンから識別子式のパース */
    parseIdentifier = (): Identifier => {
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
        const rightExpression = this.parseExpression(PrecedenceOrder.Prefix);
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

    /** ( から始まって ) までパースする
     * currentは ) で終わる
     */
    parseGroupedExpression = (): Expression | null => {
        this.goNextToken(); // currentは ( の次のトークン
        const expression = this.parseExpression(PrecedenceOrder.Lowest);
        // ここまででcurrentは式の最後のトークンになってるから、次には ) があるべき。無いと()が閉じられてない。
        if (this.getPeekToken().type === tokens.rightParen) {
            this.goNextToken(); // currentはrigthParen
        } else {
            this.errors.push(`no ) after ${expression?.print()}`);
            return null;
        }

        return expression;
    };

    /** if トークンから始まってパース
     * current が } で終わる
     */
    parseIfExpression = (): Expression | null => {
        const firstToken = this.currentToken;

        if (!this.expectPeekGoNext(tokens.leftParen)) return null; // if -> (

        // 条件式
        const conditionExpression = this.parseGroupedExpression(); // -> )
        if (conditionExpression == null) return null;

        if (!this.expectPeekGoNext(tokens.leftBrace)) return null; // ) -> {

        this.goNextToken(); // { -> ブロック文の最初

        // trueのブロック文
        const consequenceStatement = this.parseBlockStatement(); // -> }
        if (consequenceStatement == null) return null;

        let alternativeStatement = null;
        // elseがあればparse
        if (this.peekToken.type === tokens.else) {
            this.goNextToken(); // } -> else

            if (!this.expectPeekGoNext(tokens.leftBrace)) return null; // else -> {

            this.goNextToken(); // { -> ブロック文の最初

            // trueのブロック文
            alternativeStatement = this.parseBlockStatement(); // -> }
            if (alternativeStatement == null) return null;
        }

        return new IfExpression(
            firstToken,
            conditionExpression,
            consequenceStatement,
            alternativeStatement
        );
    };

    /** fnから関数リテラルをパース
     * currentが } で終わる
     */
    parseFunctionLiteral = (): Expression | null => {
        const firstToken = this.currentToken;
        if (!this.expectPeekGoNext(tokens.leftParen)) return null; // fn -> (

        this.goNextToken(); // ( - > ident | )
        const parameterArray: Identifier[] = [];
        while (this.currentToken.type !== tokens.rightParen) {
            const ident = this.parseIdentifier();
            if (ident == null) return null;
            parameterArray.push(ident);
            this.goNextToken(); // ident -> , | )
            if (this.currentToken.type === tokens.comma) {
                this.goNextToken(); // , -> ident
            }
        } // current ) で終わる

        if (!this.expectPeekGoNext(tokens.leftBrace)) return null; // ) -> {
        this.goNextToken(); // { -> ブロック文の最初
        const bodyStatement = this.parseBlockStatement();
        if (bodyStatement == null) return null;
        return new FunctionLiteral(firstToken, parameterArray, bodyStatement);
    };
}

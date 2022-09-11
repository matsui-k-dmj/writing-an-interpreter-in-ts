import { Token, tokens } from 'token';

export interface Node {
    /** テストとデバッグ用 */
    tokenLiteral: () => string;
}

export interface Statement extends Node {
    /** statementとexpressionを分けるためのダミー */
    nodeType: 'statement';
}

export interface Expression extends Node {
    /** statementとexpressionを分けるためのダミー */
    nodeType: 'expression';
    /** デバッグ用に式をプリント e.g. '(a + (b * c))' */
    print: () => string;
}

/**
 * ASTのルートノード
 * プログラムはStatementの配列で表される
 */
export class AstRoot implements Node {
    constructor(public statementArray: Statement[]) {}
    tokenLiteral: () => string = () => {
        if (this.statementArray.length > 0) {
            return this.statementArray[0].tokenLiteral();
        } else {
            return '';
        }
    };
}

/** let 文 */
export class LetStatement implements Statement {
    constructor(
        public token: { type: typeof tokens.let; literal: string },
        /** 左辺の識別子 */
        public name: Identifier,
        /** 右辺の値を生成する式 */
        public value: Expression
    ) {}
    nodeType = 'statement' as const;
    tokenLiteral: () => string = () => this.token.literal;
}

/** return 文 */
export class ReturnStatement implements Statement {
    constructor(
        public token: { type: typeof tokens.return; literal: string },
        /** 右辺の値を生成する式 */
        public returnValue: Expression
    ) {}
    nodeType = 'statement' as const;
    tokenLiteral: () => string = () => this.token.literal;
}

/** 式文 */
export class ExpresstionStatement implements Statement {
    constructor(public token: Token, public expression: Expression) {}
    nodeType = 'statement' as const;
    tokenLiteral: () => string = () => this.token.literal;
}

/**
 * 識別子
 * let 左辺の識別子は式ではないが、他の識別子は代入されてる値を生成する式なので、単純のためにどちらの場合も式で表す
 */
export class Identifier implements Expression {
    constructor(
        public token: { type: typeof tokens.ident; literal: string },
        public value: string
    ) {}
    nodeType = 'expression' as const;
    tokenLiteral: () => string = () => this.token.literal;
    print: () => string = this.tokenLiteral;
}

/** 整数リテラル */
export class IntegerLiteral implements Expression {
    constructor(
        public token: { type: typeof tokens.int; literal: string },
        public value: number
    ) {}
    nodeType = 'expression' as const;
    tokenLiteral: () => string = () => this.token.literal;
    print: () => string = this.tokenLiteral;
}

/** 前置演算子 */
export class PrefixOperation implements Expression {
    constructor(
        public token: {
            type: typeof tokens.bang | typeof tokens.minus;
            literal: string;
        },
        public operator: typeof tokens.bang | typeof tokens.minus,
        public right: Expression
    ) {}
    nodeType = 'expression' as const;
    tokenLiteral: () => string = () => this.token.literal;
    print = () => `(${this.operator}${this.right.print()})`;
}

/** 中置演算子 */
export class InfixOperation implements Expression {
    constructor(
        public token: Token,
        public operator: string,
        public right: Expression,
        public left: Expression
    ) {}
    nodeType = 'expression' as const;
    tokenLiteral: () => string = () => this.token.literal;
    print = (): string =>
        `(${this.left.print()} ${this.operator} ${this.right.print()})`;
}

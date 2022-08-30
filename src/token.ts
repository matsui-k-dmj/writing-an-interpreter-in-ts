export const tokens = {
    ILLEGAL: 'ILLEGAL',
    EOF: 'EOF',

    // 識別子, リテラル
    ident: 'ident', // foo, x, y
    int: 'int', // 42, 1999

    // 演算子
    assign: '=',
    plus: '+',

    // デリミタ
    comma: ',',
    semicolon: ';',

    leftParen: '(',
    rightParen: ')',
    leftBrace: '{',
    rightBrace: '}',

    // キーワード
    function: 'function',
    let: 'let',
} as const;

export interface Token {
    /** ex) int, ident,... */
    type: typeof tokens[keyof typeof tokens];
    /** ex) 5, hoge,... */
    literal: string;
}

export const tokens = {
    ILLEGAL: 'ILLEGAL',
    EOF: 'EOF',

    // 識別子, リテラル
    ident: 'ident', // foo, x, y
    int: 'int', // 42, 1999

    // 演算子
    assign: '=',
    plus: '+',
    minus: '-',
    bang: '!',
    asterisk: '*',
    slash: '/',
    lessThan: '<',
    greaterThan: '>',

    eq: '==',
    notEq: '!=',

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
    if: 'if',
    else: 'else',
    return: 'return',
    true: 'true',
    false: 'false',
} as const;

export const keywords = new Map([
    ['fn', tokens.function],
    ['let', tokens.let],
    ['if', tokens.if],
    ['else', tokens.else],
    ['return', tokens.return],
    ['true', tokens.true],
    ['false', tokens.false],
]);

export const lookupIdent = (word: string) => {
    return keywords.get(word) ?? tokens.ident;
};

export interface Token {
    /** ex) int, ident,... */
    type: typeof tokens[keyof typeof tokens];
    /** ex) 5, hoge,... */
    literal: string;
}

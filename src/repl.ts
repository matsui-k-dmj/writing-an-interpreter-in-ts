import { evalNode } from 'evaluator';
import { Lexer } from 'lexer';
import { Parser } from 'parser';
import readline from 'readline';

/**
 * 標準入力から一行取得する
 */
const question = (question: string) => {
    const readlineInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise<string>((resolve) => {
        readlineInterface.question(question, (answer) => {
            resolve(answer);
            readlineInterface.close();
        });
    });
};

const prompt = '>> ';

/**
 * REPLを開始する
 */
const start = async () => {
    while (true) {
        const text = await question(prompt);
        const lexer = new Lexer(text);
        const parser = new Parser(lexer);
        const astRoot = parser.parseProgram();
        const result = evalNode(astRoot);
        if (result == null) {
            console.log('result is null');
        } else {
            console.log(result.inspect());
        }

        if (parser.errors.length > 0) {
            console.log(parser.errors);
        }
    }
};

start();

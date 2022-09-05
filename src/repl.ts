import { Lexer } from 'lexer';
import readline from 'readline';
import { tokens } from 'token';

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
        while (true) {
            const tok = lexer.goNextToken();
            console.log(tok);
            if (tok.type === tokens.EOF) {
                break;
            }
        }
    }
};

start();

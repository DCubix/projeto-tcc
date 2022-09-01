import { Option } from '../core/monad';
import { DataType, OpCode, Register, VirtualMachine, DMAOffset, Value } from './vm';

enum TokenType {
    Identifier,
    Number, // hex or decimal
    String, // double quoted string
    Add, // +
    Sub, // -
    LParen, // (
    RParen, // )
    Label, // _something:
    Comma, // ,
    At, // @
    Dollar, // $
    Hash, // #
    Keyword // jmp, mov ...
}

const KeywordsMap: { [name: string]: OpCode } = {
    'nop': OpCode.Nop,
    'mov': OpCode.Mov,
    'jmp': OpCode.Jmp,
    'cal': OpCode.Cal,
    'ret': OpCode.Ret,
    'cmp': OpCode.Cmp,
    'jmc': OpCode.Jmc,
    'add': OpCode.Add,
    'sub': OpCode.Sub,
    'not': OpCode.Not,
    'and': OpCode.And,
    'or': OpCode.Or,
    'xor': OpCode.Xor,
    'wro': OpCode.Wro,
    'rdi': OpCode.Rdi,
    'rst': OpCode.Rst,
    'hlt': OpCode.Hlt,
    'db': OpCode.Db,
    'str': OpCode.Str
};

class Token {
    type: TokenType;
    lexeme: string;
    value: number;

    constructor(type: TokenType, lexeme: string, value: number) {
        this.type = type;
        this.lexeme = lexeme;
        this.value = value;
    }
}

class Tokenizer {
    private _input: string[];

    constructor(input: string) {
        this._input = input.split('');
    }

    private next(): string | null {
        return this._input.shift() || null;
    }

    private peek(): string | null {
        return this._input[0] || null;
    }

    private readQuotedString(): string {
        let result = '';
        while (this.peek() != null && this.peek() !== '"') {
            result += this.next();
        }
        // if theres no closing quote, throw an error
        if (this.peek() !== '"') {
            throw new Error('Unterminated string');
        } else {
            this.next();
        }

        return result;
    }

    private readNumber(): string {
        let result = '';
        while (this.peek() != null && /[0-9a-fA-FxX]/.test(this.peek() || '')) {
            result += this.next();
        }
        return result;
    }

    private readIdentifier(): string {
        let result = '';
        while (this.peek() != null && /[a-zA-Z0-9_]/.test(this.peek() || '')) {
            result += this.next();
        }
        return result;
    }

    private readToken(): Token | null {
        let c = this.peek();
        if (c === null) {
            throw new Error('Unexpected end of input');
        }
        
        if (c === '"') {
            this.next();
            return new Token(TokenType.String, this.readQuotedString(), 0);
        } else if (/[0-9]/.test(c)) {
            let result = this.readNumber();
            return new Token(TokenType.Number, result, /[xa-f]/.test(result.toLowerCase()) ? parseInt(result, 16) : parseInt(result));
        } else if (/[a-zA-Z0-9_]/.test(c)) {
            let id = this.readIdentifier();
            if (Object.keys(KeywordsMap).includes(id.toLowerCase())) {
                return new Token(TokenType.Keyword, id, 0);
            } else if (this.peek() === ':') {
                this.next();
                return new Token(TokenType.Label, id, 0);
            }
            return new Token(TokenType.Identifier, id, 0);
        } else if (c === '+') {
            this.next();
            return new Token(TokenType.Add, '+', 0);
        } else if (c === '-') {
            this.next();
            return new Token(TokenType.Sub, '-', 0);
        } else if (c === '(') {
            this.next();
            return new Token(TokenType.LParen, '(', 0);
        } else if (c === ')') {
            this.next();
            return new Token(TokenType.RParen, ')', 0);
        } else if (c === ',') {
            this.next();
            return new Token(TokenType.Comma, ',', 0);
        } else if (c === '@') {
            this.next();
            return new Token(TokenType.At, '@', 0);
        } else if (c === '$') {
            this.next();
            return new Token(TokenType.Dollar, '$', 0);
        } else if (c === '#') {
            this.next();
            return new Token(TokenType.Hash, '#', 0);
        } else {
            this.next();
        }
        return null;
    }

    public readAll(): Token[] {
        let result: Token[] = [];
        while (this._input.length > 0) {
            let tok = this.readToken();
            if (tok)
                result.push(tok);
        }
        return result;
    }
}

export class Parser {

    private _tokens: Token[];
    private _last: Token | null;

    private _labelTable: { [name: string]: number } = {};
    private _programOutput: Value[] = [];

    constructor(input: string) {
        this._tokens = new Tokenizer(input).readAll();
        this._last = null;
    }

    private get hasTokens(): boolean {
        return this._tokens.length > 0;
    }

    private get current(): Option<Token> {
        if (this._tokens.length === 0) {
            return Option.none();
        }
        return Option.some(this._tokens[0]);
    }

    private get last(): Option<Token> {
        if (this._last === null) {
            return Option.none();
        }
        return Option.some(this._last);
    }

    private advance(): void {
        if (!this.hasTokens) {
            return;
        }
        this._last = this._tokens.shift()!;
    }

    private accept(type: TokenType): boolean {
        const ok = this.current
            .bind(t => Option.some(t.type))
            .bind(t => Option.some(t === type))
            .valueOr(false);
        if (ok) {
            this.advance();
        }
        return ok;
    }

    private expect(type: TokenType): boolean {
        if (this.accept(type)) {
            return true;
        }
        throw new Error(`Expected token ${type}`);
    }

    private parseNumericAtom(): Value {
        if (this.accept(TokenType.Number)) {
            let val = this.last.value!.value;
            return new Value(DataType.Immediate, val);
        } else if (this.accept(TokenType.Identifier)) {
            let id = this.last.value!.lexeme;
            return new Value(DataType.Immediate, this._labelTable[id]);
        } else if (this.accept(TokenType.LParen)) {
            let result = this.parseExpression();
            this.expect(TokenType.RParen);
            return result;
        } else {
            throw new Error(`Expected number or identifier`);
        }
    }

    private parseExpression(): Value {
        let left = this.parseNumericAtom();
        if (this.accept(TokenType.Add)) {
            let right = this.parseExpression();
            return new Value(DataType.Immediate, left.value + right.value);
        } else if (this.accept(TokenType.Sub)) {
            let right = this.parseExpression();
            return new Value(DataType.Immediate, left.value - right.value);
        }
        return left;
    }

    private parseAtom(): Value | Value[] {
        if (this.accept(TokenType.String)) {
            let ret: Value[] = [];
            for (let c of this.last.value!.lexeme.split('')) {
                ret.push(new Value(DataType.Immediate, c.charCodeAt(0)));
            }
            return ret;
        } else if (this.accept(TokenType.Hash)) {
            let id = this.current.value!.lexeme;
            this.expect(TokenType.Identifier);
            let map: { [name: string]: Register } = { 'X': Register.X, 'Y': Register.Y };
            let reg = map[id.toUpperCase()];
            return new Value(DataType.Register, reg as number);
        } else if (this.accept(TokenType.Dollar)) {
            let addr = this.parseExpression().value;
            return new Value(DataType.Address, addr);
        } else if (this.accept(TokenType.At)) {
            this.expect(TokenType.Number);
            let index = this.last.value!.value;
            return new Value(DataType.Pin, index);
        } else {
            return this.parseExpression();
        }
    }

    private parseArray(): Value[] {
        let result: Value[] = [];
        while (this.hasTokens) {
            let val = this.parseAtom();
            if (val instanceof Value) {
                result.push(val);
            } else {
                result.push(...val);
            }
            if (!this.accept(TokenType.Comma)) {
                break;
            }
        }
        return result;
    }

    private parseLabel(): void {
        if (this.accept(TokenType.Label)) {
            let id = this.last.value!.lexeme;
            this._labelTable[id] = this._programOutput.length;
        }
    }

    private parseInstruction(): Value[] {
        let ret: Value[] = [];
        if (this.accept(TokenType.Keyword)) {
            let kw = this.last.value!.lexeme.toLowerCase();
            ret.push(new Value(DataType.OpCode, KeywordsMap[kw] as number));
            ret.push(...this.parseArray());
        } else {
            this.parseLabel();
        }
        return ret;
    }

    public parseAll(): void {
        this._programOutput = [];
        while (this.hasTokens) {
            this._programOutput.push(...this.parseInstruction());
        }
    }

    public get programOutput(): Value[] {
        return this._programOutput;
    }

    public get labelTable(): { [name: string]: number } {
        return this._labelTable;
    }

}
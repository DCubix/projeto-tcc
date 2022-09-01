export enum OpCode {
    Nop = 0,
    Mov,
    Jmp,
    Cal,
    Ret,
    Cmp,
    Jmc,
    Add,
    Sub,
    Not,
    And,
    Or,
    Xor,
    Wro,
    Rdi,
    Rst,
    Hlt,
    Db,
    Str
}

export enum ComparisonOpCode {
    Eq = 0,
    Ne,
    Lt,
    Le,
    Gt,
    Ge
}

export enum Register {
    X = 0,
    Y,
    R
}

export enum DataType {
    Null = 0,
    Immediate,
    OpCode,
    Register,
    Address,
    Pin
}

export const MaxMemorySize = 256;
export const MaxProgramSize = 200;
export const DMAOffset = 0xC9;

export class Value {
    private _type: DataType;
    private _value: number;

    constructor(type: DataType, value: number) {
        this._type = type;
        this._value = value & 0xFF;
    }

    get type(): DataType {
        return this._type;
    }

    get value(): number {
        return this._value;
    }

    toString(): string {
        return `${DataType[this._type]} (${this._value})`;
    }
}

export class Memory {

    private _data: Array<Value>;
    private _protectedAddresses: number[];

    constructor() {
        this._data = new Array<Value>(MaxMemorySize);
        this._protectedAddresses = [];

        for (let i = 0; i < MaxProgramSize; i++) {
            this._protectedAddresses.push(i);
        }
    }

    public read(address: number): Value {
        if (address < 0 || address >= this._data.length) {
            // TODO: Error handling
            throw new Error(`Invalid memory address: ${address}`);
        }
        return this._data[address];
    }

    public write(address: number, value: Value): void {
        if (address < 0 || address >= this._data.length) {
            // TODO: Error handling
            throw new Error(`Invalid memory address: ${address}`);
        }
        if (this._protectedAddresses.indexOf(address) !== -1) {
            throw new Error(`Protected memory address: ${address}`);
        }
        this._data[address] = value;
    }

    public writeNoCheck(address: number, value: Value): void {
        this._data[address] = value;
    }

    public dump(): void {
        for (let i = 0; i < this._data.length; i++) {
            console.log(`${i}: ${this._data[i]}`);
        }
    }

}

export class VirtualMachine {

    private _memory: Memory;
    private _registers: Uint8Array;

    private _pc: number;
    private _haltSignal: boolean;
    private _ioInterrupt: boolean;

    private _jumpStack: number[] = [];

    constructor() {
        this._memory = new Memory();
        this._registers = new Uint8Array(3);
        this._pc = 0;
        this._ioInterrupt = false;
        this._haltSignal = false;
    }

    public loadProgram(program: Array<Value>): void {
        for (let i = 0; i < program.length; i++) {
            this._memory.writeNoCheck(i, program[i]);
        }
    }

    public registerGet(register: Register): number {
        return this._registers[register];
    }

    public registerSet(register: Register, value: number): void {
        this._registers[register] = value & 0xFF;
    }

    get memory(): Memory {
        return this._memory;
    }

    get halted(): boolean {
        return this._haltSignal;
    }

    public release(): void {
        this._ioInterrupt = false;
    }

    private advance(): void {
        this._pc++;
    }

    private current(): Value {
        if (this._pc >= MaxProgramSize) {
            return new Value(DataType.Null, 0);
        }
        return this._memory.read(this._pc);
    }

    private fetch(): Value {
        const val: Value = this.current(); this.advance();
        return val;
    }

    public fetchAndRun(): void {
        if (this._ioInterrupt) {
            const op: OpCode = this.current().value as OpCode;
            this._runOpCode(op);
        } else {
            const val: Value = this.fetch();
            if (val.type !== DataType.OpCode) {
                return;
            }
        
            const op: OpCode = val.value as OpCode;
            this._runOpCode(op);
        }
    }

    private _runOpCode(op: OpCode): void {
        switch (op) {
            case OpCode.Mov: this._mov(); break;
            case OpCode.Jmp: this._jmp(); break;
            case OpCode.Cal: this._cal(); break;
            case OpCode.Ret: this._ret(); break;
            case OpCode.Cmp: this._cmp(); break;
            case OpCode.Jmc: this._jmc(); break;
            case OpCode.Add: this._add(); break;
            case OpCode.Sub: this._sub(); break;
            case OpCode.Not: this._not(); break;
            case OpCode.And: this._and(); break;
            case OpCode.Or: this._or(); break;
            case OpCode.Xor: this._xor(); break;
            case OpCode.Wro: this._wro(); break;
            case OpCode.Rdi: this._rdi(); break;
            case OpCode.Rst: this._rst(); break;
            case OpCode.Hlt: this._hlt(); break;
            case OpCode.Db: this._db(); break;
            case OpCode.Str: this._str(); break;
            default: break;
        }
    }

    private _str(): void {
        const reg: Value = this.fetch();
        const dst: Value = this.fetch();

        if (reg.type !== DataType.Register) {
            throw new Error(`(STR) Invalid register type: ${reg.type}`);
        }

        if (dst.type !== DataType.Address) {
            throw new Error(`(STR) Invalid address type: ${dst.type}`);
        }

        const value: number = this.registerGet(reg.value as Register);
        this._memory.write(dst.value, new Value(DataType.Immediate, value));
    }

    private  _db(): void {
        // next until next opcode
        while (this.current().type !== DataType.OpCode) {
            this.advance();
        }
    }

    private _mov(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Register) {
            throw new Error(`(MOV) Invalid destination type: ${src.type}`);
        }

        this._setRegister(src, dst.value as Register);
    }

    private _jmp(): void {
        const addr: Value = this.fetch();
        if (addr.type !== DataType.Immediate && addr.type !== DataType.Register) {
            throw new Error(`(JMP) Invalid address type: ${addr.type}`);
        }
        this._pc = this._getValue(addr);
    }

    private _cal(): void {
        const addr: Value = this.fetch();

        if (addr.type !== DataType.Immediate && addr.type !== DataType.Register) {
            throw new Error(`(JMP) Invalid address type: ${addr.type}`);
        }
        this._jumpStack.push(this._pc);
        this._pc = this._getValue(addr);
    }

    private _ret(): void {
        if (this._jumpStack.length === 0) {
            this._haltSignal = true;
            return;
        }
        this._pc = this._jumpStack.pop() || this._pc;
    }

    private _cmp(): void {
        const src: Value = this.fetch();
        const op: Value = this.fetch();

        if (op.type !== DataType.Immediate) {
            throw new Error(`(CMP) Invalid comparison opcode type: ${op.type}`);
        }

        if (src.type !== DataType.Register) {
            throw new Error(`(CMP) Invalid source type: ${src.type}`);
        }
        
        const comparisonOpCode: ComparisonOpCode = op.value as ComparisonOpCode;
        switch (comparisonOpCode) {
            case ComparisonOpCode.Eq: this.registerSet(Register.R, this._getValue(src) === 0 ? 1 : 0); break;
            case ComparisonOpCode.Ne: this.registerSet(Register.R, this._getValue(src) !== 0 ? 1 : 0); break;
            case ComparisonOpCode.Gt: this.registerSet(Register.R, this._getValue(src) > 0 ? 1 : 0); break;
            case ComparisonOpCode.Ge: this.registerSet(Register.R, this._getValue(src) >= 0 ? 1 : 0); break;
            case ComparisonOpCode.Lt: this.registerSet(Register.R, this._getValue(src) < 0 ? 1 : 0); break;
            case ComparisonOpCode.Le: this.registerSet(Register.R, this._getValue(src) <= 0 ? 1 : 0); break;
        }
    }

    private _jmc(): void {
        const addr: Value = this.fetch();
        if (addr.type !== DataType.Immediate && addr.type !== DataType.Register) {
            throw new Error(`(JMP) Invalid address type: ${addr.type}`);
        }
        if (this.registerGet(Register.R) === 1) {
            this._pc = this._getValue(addr);
        }
    }

    private _add(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Register) {
            throw new Error(`(ADD) Invalid destination type: ${dst.type}`);
        }

        let a = this._getValue(src);
        let b = this._getValue(dst);
        this._setRegister(new Value(DataType.Immediate, a + b), dst.value as Register);
    }

    private _sub(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Register) {
            throw new Error(`(ADD) Invalid destination type: ${dst.type}`);
        }

        let a = this._getValue(src);
        let b = this._getValue(dst);
        this._setRegister(new Value(DataType.Immediate, b - a), dst.value as Register);
    }

    private _not(): void {
        const src: Value = this.fetch();

        if (src.type !== DataType.Register) {
            throw new Error(`(NOT) Invalid source type: ${src.type}`);
        }

        this._setRegister(new Value(DataType.Immediate, ~this._getValue(src)), src.value as Register);
    }

    private _and(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Register) {
            throw new Error(`(AND) Invalid destination type: ${dst.type}`);
        }

        let a = this._getValue(src);
        let b = this._getValue(dst);
        this._setRegister(new Value(DataType.Immediate, a & b), dst.value as Register);
    }

    private _or(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Register) {
            throw new Error(`(OR) Invalid destination type: ${dst.type}`);
        }

        let a = this._getValue(src);
        let b = this._getValue(dst);
        this._setRegister(new Value(DataType.Immediate, a | b), dst.value as Register);
    }

    private _xor(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Register) {
            throw new Error(`(XOR) Invalid destination type: ${dst.type}`);
        }

        let a = this._getValue(src);
        let b = this._getValue(dst);
        this._setRegister(new Value(DataType.Immediate, a ^ b), dst.value as Register);
    }

    private _wro(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Pin) {
            throw new Error(`(WRO) Invalid destination type: ${dst.type}`);
        }

        this._setOutput(src, dst.value as number);
    }

    private _rdi(): void {
        const src: Value = this.fetch();
        const dst: Value = this.fetch();

        if (dst.type !== DataType.Register) {
            throw new Error(`(RDI) Invalid destination type: ${dst.type}`);
        }

        // go back to the opcode
        this._pc -= !this._ioInterrupt ? 3 : 2;

        this._ioInterrupt = true;
        let val = this._memory.read(DMAOffset + this._getValue(src));
        this._setRegister(new Value(DataType.Immediate, this._getValue(val)), dst.value as Register);
    }

    private _rst(): void {
        // reset everything
        this._pc = 0;
        this._registers = new Uint8Array(3);
        for (let i = DMAOffset; i < MaxMemorySize; i++) {
            this._memory.write(i, new Value(DataType.Null, 0));
        }
        this._jumpStack = [];
        this._ioInterrupt = false;
        this._haltSignal = false;
    }

    private _hlt(): void {
        this._haltSignal = true;
    }

    private _getValue(src: Value): number {
        switch (src.type) {
            case DataType.Immediate:
                return src.value;
            case DataType.Register:
                return this.registerGet(src.value as Register);
            case DataType.Address:
                return this.memory.read(src.value).value;
            default: return this._pc;
        }
    }

    private _setRegister(src: Value, dst: Register): void {
        switch (src.type) {
            case DataType.Immediate:
                this.registerSet(dst, src.value);
                break;
            case DataType.Register:
                this.registerSet(dst, this.registerGet(src.value as Register));
                break;
            case DataType.Address:
                this.registerSet(dst, this.memory.read(src.value).value);
                break;
            default: break;
        }
    }

    private _setOutput(src: Value, index: number): void {
        const addr = DMAOffset + index;
        this._memory.write(addr, new Value(DataType.Immediate, this._getValue(src)));
    }

}
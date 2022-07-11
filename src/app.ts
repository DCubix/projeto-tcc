import { Parser } from './gpcd/assembler';
import { VirtualMachine } from './gpcd/vm';

const code = `main:
    mov 100, #X

_loop:
    str #X, $0xC9+5
    sub 1, #X
    cmp #X, 4
    jmc _loop
    hlt
`;

let parser = new Parser(code);
parser.parseAll();

let vm = new VirtualMachine();
vm.loadProgram(parser.programOutput);

while (!vm.halted) {
    vm.fetchAndRun();
}

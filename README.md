## Puzzle Game
---
Um explorador encontra um complexo túneis e galerias, escondida em meio a floresta após cair em um alçapão coberto de folhas e gravetos. Mal sabia ele que estava prestes a descobrir algo extraordinário.

O complexo tinha uma aparência antiga, com paredes que lembravam o estilo asteca, mas uma luz esverdeada chamou a atenção dele.

Escondida entre o musgo estava uma tela de vidro retangular, com escritas peculiares. Parecia ser uma espécie de lista de instruções. Ao limpa-la, ele descobre que a tela é sensível ao toque.

Perplexo, ele começa então a tentar decifrar os códigos.

TODO: Continuar/Elaborar mais

## Especificação do Computador Fictício
Dispositivo de Controle de Propósito Geral (GPCD)

Registradores|Memória
-------------|-------
3 (`#X`, `#Y` e `R` (imutável) )|256 bytes ($00-$FF)

## Layout de Memória
```
+------------------+
|                  |
|                  |
|                  |
|                  |
|     Programa     |
|    (200bytes)    |
|     ($00-C8)     |
|                  |
|                  |
|                  |
+------------------+
|                  |
|                  |
|       DMA.       |
|    (56 bytes)    |
|     ($C9-FF)     |
|                  |
+------------------+
```

## Conjunto de Instruções
Instrução|Descrição|Usos|Obs.
---------|---------|----|----
`nop`|Nenhuma operação||
`mov`|Mover valor para registrador|`mov 10, #X`: Mova `10` para o registrador `#X`<br/>`mov #X, #Y`: Mova o conteúdo do registrador `#X` para o registrador `#Y`<br/>`mov $1F, #X`: Mova o conteúdo da posição de memória `$1F` para o registrador `#X`|
`str`|Armazena o conteúdo de um registrador na memória|`str #X, $1F`
`jmp`|Pular para uma posição|`jmp 123`<br/>`jmp _loop`|
`cal`|Chama um procedimento|`cal 123`|
`ret`|Retorna de um procedimento|`ret`|
`cmp`|Comparar o valor de um registrador usando uma operacao|`cmp #X, opcode`|Armazena o resultado no registrador `R`
`jmc`|Pular se o valor em `R=1`|`jmc 123`<br/>`jmc _loop`|
`add`|Adição|`add 5, #X`<br/>`add #X, #Y`|
`sub`|Subtração|`sub 5, #X`<br/>`sub #X, #Y`|
`not`|Operador de negação|`not #X`|
`and`|Operador `E` binário|`and 5, #X`<br/>`and #X, #Y`|
`or`|Operador `OU` binário|`or 5, #X`<br/>`or #X, #Y`|
`xor`|Operador `OU EXCLUSIVO` binário|`xor 5, #X`<br/>`xor #X, #Y`|
`wro`|Enviar um valor para uma saída|`wro 123, @1`<br/>`wro #X, @1`|
`rdi`|Ler um sinal de uma saída e armazenar em um registrador|`rdi @1, #X`|Interrompe a execução
`rst`|Reinicia o programa|`rst`|
`hlt`|Sai do programa|`hlt`|
`db`|Define uma lista de bytes e armazena na memória|`texto: db "Olá Mundo!"`<br/>`dados: db "Teste", 0x1C, 22`|Posição 
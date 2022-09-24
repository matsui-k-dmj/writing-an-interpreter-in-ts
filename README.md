「Go 言語でつくるインタプリタ」を TypeScript で実装した

```
npm run repl
```

```
>> let fib = fn(x) {return if (x == 0) { 1 } else { if (x == 1) { 1 } else { fib(x - 1) + fib (x - 2) }}}

>> fib(30)
1346269
```

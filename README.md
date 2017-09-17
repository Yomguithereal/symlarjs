<h1 style="text-align:center">symlar<br></h1>
[![Build Status](https://travis-ci.org/josellarena/symlar.svg?branch=master)](https://travis-ci.org/josellarena/symlar) [![Coverage Status](img.shields.io/codecov/c/github/babel/babel/master.svg](https://codecov.io/github/josellarena/symlar)]
<br/><br/>

Calculate and verify similarity between strings


Verification is 1-2 orders or magnitude faster than other libraries ([leven](https://github.com/sindresorhus/leven), [talisman](https://github.com/Yomguithereal/talisman),[fast-levenshtein](https://github.com/hiddentao/fast-levenshtein), [levenshtein-edit-distance](https://github.com/wooorm/levenshtein-edit-distance)):
```shell
$ node benchmarks.js

 STANDARD VS VERIFICATION EDIT DISTANCE:

        symlar/lev                x 41.84 ops/sec ±2.88% (55 runs sampled)
        symlar/vlev               x 1,087 ops/sec ±0.90% (89 runs sampled)
        symlar/eddist             x 35.25 ops/sec ±0.57% (60 runs sampled)
        symlar/veddist            x 930 ops/sec ±0.99% (90 runs sampled)
        leven                     x 67.11 ops/sec ±0.74% (68 runs sampled)
        talisman                  x 72.37 ops/sec ±0.69% (73 runs sampled)
        fast-levenshtein          x 53.02 ops/sec ±0.69% (67 runs sampled)
        levenshtein-edit-distance x 48.50 ops/sec ±4.07% (62 runs sampled)

        fastest is symlar/vlev
```




[Full API documentation](https://josellarena.github.io/symlarjs/module-symlar.html)


## Install

```js
npm i symlar
```

## Usage

####Node

```shell
$ node
```
```js
> symlar = require('./symlar')

{ GAP: [Getter],
  LEVENSHTEIN: [Getter],
  EN_GB_PHONE: [Getter],
  eddist: [Getter],
  veddist: [Getter],
  lev: [Getter],
  vlev: [Getter],
  edsim: [Getter],
  vedsim: [Getter],
  phonesim: [Getter],
  vphonesim: [Getter] }
```



levenshtein distance

```js
> sym.lev('SIMILARITY', 'SIMILAR')

3
```

verify levenshtein distance

```js
> sym.vlev('SIMILARITY', 'SIMILAR', 3)

true
```

edit similarity

```js
> symlar.edsim('SYMLAR', 'SIMILAR', sym.LEVENSHTEIN)

0.7142857142857143
```

verify edit similarity

```js
> symlar.vedsim('SYMLAR', 'SIMILAR', sym.LEVENSHTEIN, .7)

true
```
 
phonetic similarity

```js
> sym.phonesim('SOW', 'SEW')

1
```

verify phonetic similarity
```js
> sym.vphonesim('SOW', 'SEW', .9)

true
```

custom edit similarity

```js
> symlar.edsim('SYMLAR', 'SIMILAR', (L, R) => +(L !== R)*.5)

0.85
```

custom weighted edit distance

```js
> sym.eddist('SIMILARITY', 'SIMILAR',(L, R) => +(L !== R)*.5)

1.5
```

verify weighted edit distance

```js
> sym.veddist('SIMILARITY', 'SIMILAR',(L, R) => +(L !== R)*.5, 1)

false
```

####Browser

```html
<script src='symlar.js'></script>
```
`symlar` will be available as a global


[Full API documentation](https://josellarena.github.io/symlarjs/module-goodturing.html)


## npm tasks

test
```shell
npm test
```
_Tests are  slow due there being thousands of them, as the functions are tested generatively_

coverage
```shell
npm run cover
```

benchmark
```shell
npm run bench
```

## License

MIT © [Jose Llarena](https://www.npmjs.com/~josellarena)
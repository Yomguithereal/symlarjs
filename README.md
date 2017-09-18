
<h1>symlar</h1><br/>
<p >Calculate and verify similarity between strings</p><br/>

<p>
<a href="https://www.npmjs.com/package/symlar">
<img alt="symlar npm" src="https://img.shields.io/npm/v/npm.svg">
</a>

<a href="https://travis-ci.org/JoseLlarena/symlarjs">
<img alt="Travis Status" src="https://travis-ci.org/JoseLlarena/symlarjs.svg?branch=master">
</a>

<a href="https://codecov.io/gh/JoseLlarena/symlarjs">
  <img src="https://codecov.io/gh/JoseLlarena/symlarjs/branch/master/graph/badge.svg" alt="Codecov" />
</a>
<p><br/>



Verification is 1-2 orders of magnitude faster than other libraries ([leven](https://github.com/sindresorhus/leven), [talisman](https://github.com/Yomguithereal/talisman), [fast-levenshtein](https://github.com/hiddentao/fast-levenshtein), [js-levenshtein](https://github.com/gustf/js-levenshtein), [levenshtein-edit-distance](https://github.com/wooorm/levenshtein-edit-distance)):
```shell
$ node benchmarks.js

 COMPUTATION VS VERIFICATION OF LEVENSHTEIN DISTANCE:

        symlar/lev                x 41.88 ops/sec ±5.40% (54 runs sampled)
        symlar/vlev               x 1,135 ops/sec ±1.26% (90 runs sampled)
        symlar/eddist             x 36.43 ops/sec ±1.02% (62 runs sampled)
        symlar/veddist            x 972 ops/sec ±1.46% (89 runs sampled)
        leven                     x 65.14 ops/sec ±0.70% (66 runs sampled)
        talisman                  x 81.01 ops/sec ±0.71% (69 runs sampled)
        fast-levenshtein          x 57.93 ops/sec ±1.07% (66 runs sampled)
        js-levenshtein            x 96.58 ops/sec ±1.40% (69 runs sampled)
        levenshtein-edit-distance x 62.36 ops/sec ±1.18% (64 runs sampled)

        fastest is symlar/vlev
```





[Full API documentation](https://josellarena.github.io/symlarjs/global.html)


## Install

```js
npm i symlar
```

## Usage

__Node__

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
> symlar.lev('SIMILARITY', 'SIMILAR')

3
```

verify levenshtein distance

```js
> symlar.vlev('SIMILARITY', 'SIMILAR', 3)

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
> symlar.phonesim('SOW', 'SEW')

1
```

verify phonetic similarity
```js
> symlar.vphonesim('SOW', 'SEW', .9)

true
```

custom edit similarity

```js
> symlar.edsim('SYMLAR', 'SIMILAR', (L, R) => +(L !== R)*.5)

0.85
```

custom weighted edit distance

```js
> symlar.eddist('SIMILARITY', 'SIMILAR',(L, R) => +(L !== R)*.5)

1.5
```

verify weighted edit distance

```js
> symlar.veddist('SIMILARITY', 'SIMILAR',(L, R) => +(L !== R)*.5, 1)

false
```

__Browser__

```html
<script src='symlar.js'></script>
```
`symlar` will be available as a global


[Full API documentation](https://josellarena.github.io/symlarjs/global.html)

## npm tasks

test
```shell
npm test
```
_Tests are slow due to there being thousands of them, as the functions are tested generatively_

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
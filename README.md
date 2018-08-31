# AST-based macro transforms for Rollup

Functions can improve readability.
Inlining expanded constants can improve performance.

**Build-time AST macros** allow you to take advantge of both.

## Example

### Virtual DOM Example
Build-time macro for an [IJK-like transform][ijk] for use with [hyperapp][], [superfine][], or [preact][]

```javascript
MACRO({
  H(nodeName, attributes, ...children) {
    const parts = { nodeName, attributes }
    if (0 !== children.length) {
      parts.children = `[${children.join(', ')}]`
    }

    const body = Object.entries(parts)
      .map(e => e.join(': '))
      .join(', ')

    return `({ ${body} })`
  },
})

export const view = count =>
  H("div", {}
    , H("h1", {}, count)
    , H("button", { onclick: () => render(count - 1) }, "-")
    , H("button", { onclick: () => render(count + 1) }, "+") )
```


##### Output (with [`prettier`][])

```javascript
export const view = count => ({
  nodeName: 'div',
  attributes: {},
  children: [
    { nodeName: 'h1', attributes: {}, children: [count] },
    {
      nodeName: 'button',
      attributes: { onclick: () => render(count - 1) },
      children: ['-']
    },
    {
      nodeName: 'button',
      attributes: { onclick: () => render(count + 1) },
      children: ['+']
    }
  ]
})
```

### CSS-in-JS Example

```javascript
MACRO({
  EXPR: expr => new Function(`return (${expr})`).call(null),

  LET(expr) {
    Object.assign(global, this.EXPR(expr))
    return ''
  },

  CSS(strings, ...args) {
    let res = '`' + strings[0]
    for (let i=0; i<args.length; i++)
      res += args[i] + (strings[i+1] || '')
    res += '`'
    return res
  },
})

LET({
  color: 'blue',
  height: 100,
  dayIsOdd: new Date().getDay() & 1,
  buildDate: new Date().toISOString().replace(/:\d\d\..*Z/, ''),
})

const css_styles = CSS`
  .somewhere {
    top: ${ EXPR(20 + height) } px;
    border: ${ EXPR(1 + 2) } px ${ EXPR( dayIsOdd ? 'solid' : 'dashed' ) } ${color};
  }
  .somewhere::before {
    content: "${ EXPR(buildDate) }";
  }
`
```

##### Output (with [`prettier`][])

```javascript
const css_styles = `
  .somewhere {
    top: 120 px;
    border: 3 px solid color;
  }
  .somewhere::before {
    content: "2018-08-31T16:05";
  }
`;
```

## Implementation

The heavy lifting for AST transform is provided by the excellent [`transform-ast`][] and [`magic-string`][] packages.
Macro functions are evaluated in [`VM2.NodeVM`][] isolation, providing a measure of protection from abuse.

## API

#### `MACRO(«object expression»)`

Allows defining new macros and variables. A single argument of type object is expected.
The expression will be evaluated in a `VM2.NodeVM` context and the result assigned to
the macro namespace. Any functions defined at the root will define new macros.

##### Defined macro functions

The macro's **arguments are the `getSource()` strings** of the AST arguments nodes.
(e.g. `ast_node.arguments.map(e => e.getSource())`

```javascript
MACRO({
  url: require('url'),

  EXAMPLE_SRC(...args) {
    return JSON.stringify(args)
  },
})
```

##### Allowed Builtin modules:

- `require('os')`
- `require('util')`
- `require('zlib')`
- `require('assert')`
- `require('path')`
- `require('url')`
- `require('querystring')`
- `require('punycode')`

This can be customized with `{vm2: {builtin: []}}`


##### AST transformations

Additionally, **`this.ast_node`** is the macro's [`CallExpression AST Node`](https://github.com/goto-bus-stop/transform-ast#nodes),
enabling sophisticated AST-based transformations.

```javascript
MACRO({
  EXAMPLE_ARROW_AST() {
    // translated from https://github.com/goto-bus-stop/transform-ast#example

    for (const node of this.ast_node.arguments) {
      if (node.type !== 'ArrowFunctionExpression')
        continue;

      const params = node.params.map(param =>param.getSource())

      if (node.body.type !== 'BlockStatement')
        node.body.edit.update(`{ return ${node.body.getSource()} }`)

      node.edit.update(`function (${params.join(', ')}) ${node.body.getSource()}`)
    }
  },
})
```

### Rollup Plugin Options

```javascript
import rpi_ast_macros from 'rollup-plugin-ast-macros'

// defaults:
const macros = null // or {}
const sandbox = null // or {}
const builtin = ['os', 'util', 'zlib', 'assert', 'path', 'url', 'querystring', 'punycode']

const plugins = [
  rpi_ast_macros({
    // include: 'code/**',
    exclude: ['node_modules/**'],

    ast_opt: {}, // passed to transform_ast(source, ast_opt)

    macros, // additional default macros & `this` context for macro invocation

    vm2_opt: {
      sandbox, // passed to VM2.NodeVM({sandbox})
      builtin, // passed to VM2.NodeVM({require:{builtin})
    },
  })
]
```


## License

[MIT](LICENSE)


  [`transform-ast`]: https://github.com/goto-bus-stop/transform-ast#readme
  [`magic-string`]: https://github.com/rich-harris/magic-string
  [`VM2.NodeVM`]: https://github.com/patriksimek/vm2#nodevm
  [`prettier`]: https://www.npmjs.com/package/prettier

  [ijk]: https://www.npmjs.com/package/ijk
  [hyperapp]: https://www.npmjs.com/package/hyperapp
  [superfine]: https://www.npmjs.com/package/superfine
  [preact]: https://www.npmjs.com/package/preact

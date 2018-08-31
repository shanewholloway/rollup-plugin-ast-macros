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

LET({ color: 'blue', height: 100, dayIsOdd: new Date().getDay() & 1 })

const css_styles = CSS`
  .somewhere {
    top: ${ EXPR(20 + height) } px;
    border: ${ EXPR(1 + 2) } px ${ EXPR( dayIsOdd ? 'solid' : 'dashed' ) } ${color};
  }
`

console.log(css_styles)

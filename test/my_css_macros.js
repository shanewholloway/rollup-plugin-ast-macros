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

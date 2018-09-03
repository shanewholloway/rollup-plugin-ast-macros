MACRO({
  _HSRC_(xmacro, parts) {
    if (undefined !== xmacro.chain) {
      const chain_parts = xmacro.chain().parts
      const merged = Object.assign({}, chain_parts, parts)
      if (chain_parts.children && parts.children)
        merged.children = [].concat(chain_parts.children, parts.children)
      parts = merged
    }

    const children = parts.children
    if (children && 0 !== children.length)
      parts.children = `[${children.join(', ')}]`
    else delete parts.children

    const body = Object.entries(parts)
      .map(e => e.join(': '))
      .join(', ')

    xmacro.parts = parts
    return `({ ${body} })`
  },

  _HX_(xmacro, ...args) {
    if (xmacro.opts.length !== 1)
      throw new SyntaxError('Invalid opts')

    if (undefined === xmacro.chain) {
      const nodeName = `"${xmacro.opts[0] || 'div'}"`
      const attributes = args[0]
      return undefined !== attributes
        ? this._HSRC_(xmacro, {nodeName, attributes})
        : this._HSRC_(xmacro, {nodeName})
    }

    if (1 !== xmacro.depth)
      throw new SyntaxError('Invalid nesting')

    return this[`_HX__${xmacro.opts[0]}`](xmacro, ...args)
  },

  _HX__with(xmacro, ...children) {
    return this._HSRC_(xmacro, {children})
  }
})

export const view = count =>
  HX.div().with(
      HX.h1().with(count)
    , HX.button({ onclick: () => render(count - 1) })
        .with("-")
    , HX.button({ onclick: () => render(count + 1) })
        .with("+")
    )


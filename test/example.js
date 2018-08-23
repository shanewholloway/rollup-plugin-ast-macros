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


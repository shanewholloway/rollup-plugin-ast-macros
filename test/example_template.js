import './my_css_macros.js'

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

console.log(css_styles)

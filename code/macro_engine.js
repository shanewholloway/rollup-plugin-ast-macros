const { NodeVM } = require('vm2')


export default bind_ast_macro_transform
export function bind_ast_macro_transform(macros, vm2_opt) {
  if (null == vm2_opt) vm2_opt = {}

  const builtin = vm2_opt.builtin || [
    'os', 'util', 'zlib', 'assert',
    'path', 'url', 'querystring', 'punycode', ]

  const sandbox = vm2_opt.sandbox || {}
  const vm = new NodeVM({
    require: { external: false, builtin },
    sandbox, console: 'inherit', wrapper: 'none', });

  macros = Object.create(
    macros || null,
    { MACRO: {value: MACRO} });

  ast_macro_transform.visitors = macro_builtin_visitors
  return ast_macro_transform

  function ast_macro_transform(ast_node) {
    const visitors = undefined !== this ? this
      : ast_macro_transform.visitors

    const fn = visitors[ast_node.type];
    if (undefined === fn) return ;

    const ans = fn.call(visitors, macros, ast_node)
    if (undefined !== ans) {
      ast_node.edit.update(''+ans);
    }
  }

  function MACRO(xforms) {
    // Compile the macro in the VM2 NodeVM instance
    const ans = vm.run(`return (${xforms})`);
    Object.assign(macros, ans);

    // remove the macro definition from the generated source
    return '';
  }
}

export const macro_builtin_visitors = {
  __proto__: null,

  CallExpression(macros, ast_node) {
    const callee = ast_node.callee;
    if (callee.type !== 'Identifier') return ;

    const xform = macros[callee.name];
    if ('function' !== typeof xform) return ;

    const src_args = ast_node.arguments.map(e => e.getSource());

    macros.ast_node = ast_node
    return xform.apply(macros, src_args);
  },

  TaggedTemplateExpression(macros, ast_node) {
    const tag = ast_node.tag;
    if (tag.type !== 'Identifier') return ;

    const quasi = ast_node.quasi
    if (quasi.type !== 'TemplateLiteral') return ;

    const xform = macros[tag.name];
    if ('function' !== typeof xform) return ;

    const src_args = quasi.expressions.map(e=>e.getSource())
    src_args.unshift(quasi.quasis.map(e=>e.getSource()))

    macros.ast_node = ast_node
    return xform.apply(macros, src_args);
  },
}


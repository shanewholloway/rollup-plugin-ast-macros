const { NodeVM } = require('vm2')

export default bind_ast_macro_transform
export function bind_ast_macro_transform(macros, vm2_opt) {
  if (null == vm2_opt) vm2_opt = {}

  macros = Object.create(
    macros || null,
    { MACRO: {value: MACRO} });

  const builtin = vm2_opt.builtin || [
    'os', 'util', 'zlib', 'assert',
    'path', 'url', 'querystring', 'punycode', ]

  const vm = new NodeVM({
    require: { external: false, builtin },
    sandbox: vm2_opt.sandbox,
    console: 'inherit',
    wrapper: 'none', });

  return ast_macro_transform

  function ast_macro_transform(ast_node) {
    return macro_xform(macros, ast_node);
  }

  function MACRO(xforms) {
    // Compile the macro in the VM2 NodeVM instance
    const ans = vm.run(`return (${xforms})`);
    Object.assign(macros, ans);

    // remove the macro definition from the generated source
    return '';
  }
}

export function macro_xform(macros, ast_node) {
  if (ast_node.type !== 'CallExpression') return ;

  const callee = ast_node.callee;
  if (callee.type !== 'Identifier') return ;

  const xform = macros[callee.name];
  if ('function' !== typeof xform) return ;

  const src_args = ast_node.arguments.map(e => e.getSource());
  macros.ast_node = ast_node

  const ans = xform.apply(macros, src_args);
  if ('string' === typeof ans) {
    ast_node.edit.update(ans);
  }
}


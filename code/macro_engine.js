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
    { MACRO: {value: MACRO, enumerable: true},
      ast_node: {value: null, enumerable: true, writable: true},
      ast_args: {value: null, enumerable: true, writable: true},
    });

  ast_macro_transform.visitors = macro_builtin_visitors
  return ast_macro_transform

  function ast_macro_transform(ast_node) {
    const visitors = undefined !== this ? this
      : ast_macro_transform.visitors

    const fn = visitors[ast_node.type];
    if (undefined === fn) return ;

    fn.call(visitors, macros, ast_node)
  }

  function MACRO(xforms) {
    // Compile the macro in the VM2 NodeVM instance
    const ans = vm.run(`return (${xforms})`);
    Object.assign(macros, ans);

    // remove the macro definition from the generated source
    return '';
  }
}

function as_ast_source(e) {
  if (Array.isArray(e))
    return e.map(as_ast_source);
  else if (null === e || undefined === e )
    return e;
  else if ('function' === typeof e.getSource)
    return e.getSource();
  else return e;
}

export const macro_builtin_visitors = {
  __proto__: null,

  _apply_macro(macros, xform_key, ast_node, ast_args) {
    const xform = macros[xform_key];
    ast_node.ast_macro = xform_key;

    macros.ast_node = ast_node;
    macros.ast_args = ast_args;

    const ans = xform.apply(macros, as_ast_source(ast_args));

    macros.ast_node = macros.ast_args = null;

    if (undefined !== ans) {
      ast_node.edit.update(''+ans);

      ast_node.prev_type = ast_node.type;
      ast_node.type = 'ast_macro';
    }
    return ans
  },

  CallExpression(macros, ast_node) {
    const callee = ast_node.callee;
    if (callee.type !== 'Identifier') return ;

    const xform_key = callee.name;
    if ('function' !== typeof macros[xform_key]) return ;

    const ast_args = ast_node.arguments;
    return this._apply_macro(macros, xform_key, ast_node, ast_args);
  },

  TaggedTemplateExpression(macros, ast_node) {
    const tag = ast_node.tag;
    if (tag.type !== 'Identifier') return ;

    const quasi = ast_node.quasi
    if (quasi.type !== 'TemplateLiteral') return ;

    const xform_key = tag.name;
    if ('function' !== typeof macros[xform_key]) return ;

    const ast_args = [quasi.quasis].concat(quasi.expressions);
    return this._apply_macro(macros, xform_key, ast_node, ast_args);
  },
}


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

  _xform_opt_from(ast_tip, opts) {
    while (ast_tip.type === 'MemberExpression') {
      if (ast_tip.object.type !== 'Identifier')
        throw new SyntaxError(`Invalid macro member ast.type (${ast_tip.object.type})`);

      opts.push(ast_tip.object.name);
      ast_tip = ast_tip.property
    }

    if (ast_tip.type !== 'Identifier')
      throw new SyntaxError(`Invalid macro property ast.type (${ast_tip.type})`);

    opts.push(ast_tip.name);
    return opts
  },

  _xform_from(macros, ast_ident) {
    const xmacro = {}
    const xform = {xmacro}

    if (ast_ident.type === 'Identifier') {
      xform.key = ast_ident.name;
      xform.fn = macros[xform.key]
      return 'function' === typeof xform.fn ? xform : null;
    }

    if (ast_ident.type === 'MemberExpression') {
      if (ast_ident.object.type === 'Identifier') {
        xform.key = ast_ident.object.name;
        const fn = macros[`_${xform.key}_`]
        if ('function' !== typeof fn) return null;

        xmacro.depth = 0
        xmacro.opts = this._xform_opt_from(ast_ident.property, []);

        xform.fn = fn.bind(macros, xmacro);
        return xform;
      }

      if ('ast_macro' === ast_ident.object.type) {
        const chain = ast_ident.object.xmacro
        xmacro.depth = 1 + (chain.depth|0)
        xmacro.chain = () => chain

        xform.key = chain.key;
        const fn = macros[`_${xform.key}_`]
        xmacro.opts = this._xform_opt_from(ast_ident.property, []);

        xform.fn = fn.bind(macros, xmacro);
        return xform;
      }
    }
  },

  _apply_macro(macros, xform, ast_node, ast_args) {
    const xmacro = ast_node.xmacro = xform.xmacro;
    const src_args = xmacro.src_args = as_ast_source(ast_args);
    ast_node.ast_macro = xmacro.key = xform.key;
    

    macros.ast_node = ast_node;
    macros.ast_args = ast_args;

    let ans = xform.fn.apply(macros, src_args);

    macros.ast_node = macros.ast_args = null;

    if (undefined !== ans) {
      const result = ast_node.xmacro.result = '' + ans;
      ast_node.edit.update(result);

      ast_node.prev_type = ast_node.type;
      ast_node.type = 'ast_macro';
    }
    return ans
  },

  CallExpression(macros, ast_node) {
    const xform = this._xform_from(macros, ast_node.callee)
    if (!xform) return ;

    const ast_args = ast_node.arguments;
    return this._apply_macro(macros, xform, ast_node, ast_args);
  },

  TaggedTemplateExpression(macros, ast_node) {
    const xform = this._xform_from(macros, ast_node.tag)
    if (!xform) return ;

    const quasi = ast_node.quasi
    if (quasi.type !== 'TemplateLiteral') return ;

    const ast_args = [quasi.quasis].concat(quasi.expressions);
    return this._apply_macro(macros, xform, ast_node, ast_args);
  },
}


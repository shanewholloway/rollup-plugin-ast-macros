import { createFilter } from 'rollup-pluginutils';
import bind_ast_macro_transform from './macro_engine.js';

const transform_ast = require('transform-ast');

const default_config = { exclude: 'node_modules/**' };

export default ast_macros;
function ast_macros(config) {
  config = Object.assign({}, default_config, config)

  const filter = createFilter(config.include, config.exclude);
  const sourcemap = false !== config.sourcemap && false !== config.sourceMap;

  const ast_macro_transform = bind_ast_macro_transform(config.macros, config.vm2_opt);
  if (config.visitors)
    ast_macro_transform.visitors = Object.assign(
      Object.create(ast_macro_transform.visitors),
      config.visitors);

  const magic_to_code_map = sourcemap
    ? magic_str => ({ code: magic_str.toString(), map: magic_str.map })
    : magic_str => ({ code: magic_str.toString() })

  return {
    name: 'ast-macros',
    renderChunk(source, chunk) {
      const any_module = Object.keys(chunk.modules).some(id => filter(id)) 
      if (! any_module ) return;

      const ast_opts = Object.assign({parser: this}, config.ast_opts);
      const magic_str = transform_ast(source, ast_opts, ast_macro_transform);
      return magic_to_code_map(magic_str);
    },
  };
}


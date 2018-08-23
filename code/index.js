import { createFilter } from 'rollup-pluginutils';
import bind_ast_macro_transform from './macro_engine.js';

const transformform_ast = require('transform-ast');

const default_config = { exclude: 'node_modules/**' };

export default ast_macros;
function ast_macros(config=default_config) {
  const filter = createFilter(config.include, config.exclude);
  const sourcemap = false !== config.sourcemap && false !== config.sourceMap;

  return {
    name: 'ast-macros',
    transform(source, id) {
      if (! filter(id)) return;

      const ast_macro_transform = bind_ast_macro_transform(config.macros, config.vm2_opt);

      const ast_opts = Object.assign({parser: this}, config.ast_opts);
      const magic_str = transformform_ast(source, ast_opts, ast_macro_transform);

      const code = magic_str.toString();
      return sourcemap ? { code, map: magic_str.map } : { code };
    },
  };
}


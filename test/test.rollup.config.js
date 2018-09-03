import rpi_ast_macros from 'rollup-plugin-ast-macros'
import rpi_prettier from 'rollup-plugin-prettier'

const sourcemap = 'inline'
const plugins = [ rpi_ast_macros(), rpi_prettier() ]
const external = []

export default [
  { input: 'test/example.js',
    output: {format: 'es', sourcemap},
    plugins, external },

  { input: 'test/example_template.js',
    output: {format: 'es', sourcemap},
    plugins, external },

  { input: 'test/example_vdom_oo.js',
    output: {format: 'es', sourcemap},
    plugins, external },

]


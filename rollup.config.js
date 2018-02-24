import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import sourcemaps from 'rollup-plugin-sourcemaps';
import uglify from 'rollup-plugin-uglify';

const pkg = require('./package.json');
const buildFolder = 'build';
const globalsMap = {
  'react': 'React',
  'xstream': 'xstream',
  // TODO: Does it make sense to package UMD pointing to these at all?
  'xstream/extra/dropRepeats': 'xstream',
  'xstream/extra/sampleCombine': 'xstream',
  '@cycle/run': 'Cycle',
  '@cycle/isolate': 'CycleIsolate',
  'react-cycle-connect': 'reactCycleConnect'
};

const commonExternal = [
  'react',
  'xstream',
  'xstream/extra/dropRepeats',
  'xstream/extra/sampleCombine',
  '@cycle/run',
  '@cycle/isolate'
];

const commonSettings = {
  watch: {
    include: 'src/**',
  },
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          declaration: false
        }
      }
    }),
    // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
    commonjs(),
    // Allow node_modules resolution, so you can use 'external' to control
    // which external modules to include in the bundle
    // https://github.com/rollup/rollup-plugin-node-resolve#usage
    resolve(),
    // Resolve sourcemaps to the original source
    sourcemaps()
  ]
};

const mainCfgBase = Object.assign({}, commonSettings, {
  input: 'src/index.ts',
  output: [
    {
      file: `${buildFolder}/lib/index.js`,
      name: 'reactCycleConnect',
      format: 'cjs',
      sourcemap: true
    },
    // {
    //   file: `${buildFolder}/dist/react-cycle-connect.umd.min.js`,
    //   name: 'reactCycleConnect',
    //   format: 'umd',
    //   sourcemap: true,
    //   globals: globalsMap
    // }
  ],
  external: commonExternal
});

const mainCfgMinified = Object.assign({}, mainCfgBase, {
  output: [
    {
      file: `${buildFolder}/dist/react-cycle-connect.umd.min.js`,
      name: 'reactCycleConnect',
      format: 'umd',
      sourcemap: true,
      globals: globalsMap
    }
  ],
  plugins: commonSettings.plugins.concat(uglify())
})

const extraOnionifyCfgBase = Object.assign({}, commonSettings, {
  input: 'src/extra/onionify/index.ts',
  output: [
    {
      file: `${buildFolder}/lib/extra/onionify/index.js`,
      name: 'reactCycleConnect.extra.onionify',
      format: 'cjs',
      sourcemap: true
    },
    // {
    //   file: `${buildFolder}/dist/react-cycle-connect-extra-onionify.umd.min.js`,
    //   name: 'reactCycleConnect.extra.onionify',
    //   format: 'umd',
    //   sourcemap: true,
    //   globals: globalsMap
    // }
  ],
  external: commonExternal.concat([
    'cycle-onionify',
    'react-cycle-connect'
  ])
});

const extraOnionifyCfgMinified = Object.assign({}, extraOnionifyCfgBase, {
  output: [
    {
      file: `${buildFolder}/dist/react-cycle-connect-extra-onionify.umd.min.js`,
      name: 'reactCycleConnect.extra.onionify',
      format: 'umd',
      sourcemap: true,
      globals: globalsMap
    }
  ],
  plugins: commonSettings.plugins.concat(uglify())
})

// if (process.env.NODE_ENV === 'production') {
//   mainCfg.plugins.push(uglify());
//   extraOnionifyCfg.plugins.push(uglify());
// }

export default [
  mainCfgBase,
  mainCfgMinified,
  extraOnionifyCfgBase,
  extraOnionifyCfgMinified
];

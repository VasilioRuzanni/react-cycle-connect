import { ReactNode } from 'react';
import { run, Main } from '@cycle/run';
import { makeHTTPDriver } from '@cycle/http';
// import storageDriver from '@cycle/storage';
import { withState } from '@cycle/state';
import storageify from 'cycle-storageify';
import { cycleConnect } from 'react-cycle-connect';

const drivers = {
  HTTP: makeHTTPDriver()
  // https://gitlab.com/staltz/cycle-native-asyncstorage
  // But with https://github.com/react-native-community/async-storage/pull/284
  // storage: storageDriver
};

const wrappers = [
  // TODO: The `CycleMainFn` is currently incompatible with Cycle.js'
  // `Component` type but is being reconsidered in this regard,
  // hence this hacky `any`
  // Needs some thinking about different driver approach and if storageify is still relevant
  // (mainFn: Main) => storageify(mainFn as any, { key: 'react-cycle-connect-todomvc-state' }),
  withState
];

export interface Props {
  children: ReactNode;
}

export const MainCycle = cycleConnect({
  root: true,
  runFn: run,
  drivers,
  wrappers,
  displayName: 'Main'
})();

export default MainCycle;

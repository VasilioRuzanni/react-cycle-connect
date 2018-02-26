import { ReactNode } from 'react';
import { run } from '@cycle/run';
import { makeHTTPDriver } from '@cycle/http';
import storageDriver from '@cycle/storage';
import onionify from 'cycle-onionify';
import storageify from 'cycle-storageify';
import { cycleConnect, CycleMainFn } from 'react-cycle-connect';

const drivers = {
  HTTP: makeHTTPDriver(),
  storage: storageDriver
};

const wrappers = [
  // TODO: The `CycleMainFn` is currently incompatible with Cycle.js'
  // `Component` type but is being reconsidered in this regard,
  // hence this hacky `any`
  (mainFn: CycleMainFn) =>
    storageify(mainFn as any, { key: 'react-cycle-connect-todomvc-state' }),
  onionify
];

export interface Props {
  children: ReactNode;
}

export const RootCycle = cycleConnect({
  root: true,
  runFn: run,
  drivers,
  wrappers,
  displayName: 'RootCycle'
})();

export default RootCycle;

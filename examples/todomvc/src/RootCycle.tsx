import { ReactNode } from 'react';
import { run } from '@cycle/run';
import { makeHTTPDriver } from '@cycle/http';
import onionify from 'cycle-onionify';
import { cycleConnect } from 'react-cycle-connect';

const drivers = { HTTP: makeHTTPDriver() };
const wrappers = [onionify];

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

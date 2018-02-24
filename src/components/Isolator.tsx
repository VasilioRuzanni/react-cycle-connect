import React, { ReactNode } from 'react';
import { Scopes } from '@cycle/isolate';
import { cycleConnect } from '../cycleConnect';

export interface Props {
  children: ReactNode;
  scope: Scopes<any>;
}

export const Isolator = cycleConnect<Props>({
  isolate: (props: Props) => props.scope || void 0,
  displayName: 'Isolator'
})();

export default Isolator;

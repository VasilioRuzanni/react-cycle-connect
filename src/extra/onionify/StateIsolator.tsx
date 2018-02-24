import React, { ReactNode } from 'react';
import { Scope } from 'cycle-onionify';
import { cycleConnect } from 'react-cycle-connect';

export interface StateIsolatorProps {
  children: ReactNode;
  channelName?: string;
  lens: Scope<any, any>;
}

// TODO Assuming the use of `cycle-onionify` for now,
// make configurable, since onionify itself supports that.
const DEFAULT_STATE_CHANNEL_NAME = 'onion';

export const StateIsolator = cycleConnect<StateIsolatorProps>({
  isolate: (props: StateIsolatorProps) => ({
    [props.channelName || DEFAULT_STATE_CHANNEL_NAME]:
      props.lens || void 0,
    '*': null
  }),
  displayName: 'StateIsolator'
})();

export default StateIsolator;

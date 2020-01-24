import { ErrorInfo } from "react";
import xs, { Stream, MemoryStream } from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import { adapt } from "@cycle/run/lib/adapt";
import { Sources, Sinks, Drivers, Main } from "@cycle/run";
import { CycleMainFn } from "../types";

const lifecycleHookNames = [
  "willMount",
  "didMount",
  "willReceiveProps",
  "willUpdate",
  "didUpdate",
  "willUnmount",
  "didCatch"
];

export interface ReactLifecycleStreams<TProps> {
  willMount$: Stream<null>;
  didMount$: Stream<null>;
  willReceiveProps$: Stream<TProps>;
  willUpdate$: Stream<TProps>;
  didUpdate$: Stream<TProps>;
  willUnmount$: Stream<null>;
  didCatch$: Stream<{
    error: Error;
    errorInfo: ErrorInfo;
  }>;
}

export class ReactLifecycleSource<TProps> {
  lifecycleStreams: ReactLifecycleStreams<TProps>;

  constructor(lifecycleStreams: ReactLifecycleStreams<TProps>) {
    this.lifecycleStreams = lifecycleStreams;
  }
}

lifecycleHookNames.forEach(hookName => {
  ReactLifecycleSource.prototype[hookName] = function() {
    return this.lifecycleStreams[`${hookName}$`];
  };
});

export function makeReactLifecycleWrapper<TProps>(): {
  lifecycleWrapper: (mainFn: CycleMainFn) => CycleMainFn;
  lifecycleStreams: ReactLifecycleStreams<TProps>;
} {
  const name = "lifecycle";

  const lifecycleStreams = {} as ReactLifecycleStreams<TProps>;
  lifecycleHookNames.forEach(hookName => {
    lifecycleStreams[`${hookName}$`] = new Stream<any>();
  });

  function reactLifecycleWrapper(mainFn: CycleMainFn): CycleMainFn {
    return function mainWithReactLifecycle(
      sources: Sources<Drivers>
    ): Sinks<Main> {
      const _sources = {
        ...sources,
        [name]: new ReactLifecycleSource(lifecycleStreams)
      };

      return mainFn(_sources);
    };
  }

  return {
    lifecycleWrapper: reactLifecycleWrapper,
    lifecycleStreams
  };
}

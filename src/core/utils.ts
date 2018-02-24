import xs, { Stream, Subscription } from 'xstream';
import { Drivers, Sources, Sinks, SinkProxies } from '@cycle/run';
import isolate from '@cycle/isolate';
import {
  CycleMainFn,
  CycleMainFnWrapper,
  CycleConnectOptionsProps,
  IsolateOption
} from '../types';

// [[TODO: Think about renaming SinkProxies to something else maybe
// to prevent confusing them with `@cycle/run`s SinkProxies type
// and semantics of operating on the "run" side]]

// Borrowed from `@cycle/run` itself (TODO: we might need a different type)
// TODO: How to abstract away from `xs` here?
// I mean, this is not really only internal stuff, its what drives
// the app, so the actual streams should be a particular lib streams
// (xstream, RxJS, most)
export function makeSinkProxies<So extends Sources, Si extends Sinks>(
  driversOrSources: Drivers<So, Si> | So
): SinkProxies<Si> {
  const sinkProxies: SinkProxies<Si> = {} as SinkProxies<Si>;
  // Note, that in both cases (drivers and sources) we need to preserve
  // all `sources`'  attributes, even if they're undefined, because there
  // might be write-only drivers that provide nothing as source, but still
  // expect something as sinks. So, if we filter them out as being "falsy"
  // and not create a sink proxy with that name, then we would never get
  // a value from a program to a write-only driver.
  for (const name in driversOrSources) {
    if (driversOrSources.hasOwnProperty(name)) {
      sinkProxies[name] = xs.create<any>();
    }
  }
  return sinkProxies;
}

export function subscribeStreamToStream(
  stream: Stream<any>,
  sourceStream: Stream<any>,
  sourceName?: string
): Subscription {
  return sourceStream.subscribe({
    next: (value: any) => stream._n(value),
    error: (error: any) => stream._e(error),
    // tslint:disable-next-line:no-empty
    complete: () => {} // Noop
  });
}

export function subscribeSinkProxiesToSinks(
  sinkProxies: SinkProxies<Sinks>,
  sinks: Sinks
): Subscription[] {
  const sinkNames: Array<keyof Sinks> = Object.keys(sinks).filter(
    name => !!sinkProxies[name]
  );

  return sinkNames.map(name =>
    subscribeStreamToStream(
      sinkProxies[name],
      xs.fromObservable(sinks[name] as any),
      name
    )
  );
}

export function pipeWrapper(f: CycleMainFnWrapper, g: CycleMainFnWrapper) {
  return (mainFn: CycleMainFn) => g(f(mainFn));
}

export function wrapMain(
  mainFn: CycleMainFn,
  wrappers: CycleMainFnWrapper[] = []
): CycleMainFn {
  if (!wrappers.length) {
    return mainFn;
  }

  const combinedWrapperFn = wrappers.reduce(pipeWrapper, (value: any) => value);
  return combinedWrapperFn(mainFn);
}

export function maybeIsolate<P extends CycleConnectOptionsProps>(
  mainFn: CycleMainFn,
  isolateOption?: IsolateOption,
  isRootCycle?: boolean,
  initialProps?: P
): CycleMainFn {
  // Rendering-level `isolate` prop, overrides component-level
  // `isolate` option
  const isolateProp =
    initialProps && typeof initialProps.isolate !== 'undefined'
      ? initialProps.isolate
      : void 0;

  if (isolateProp) {
    isolateOption = isolateProp;
  }

  // Do nothing unless there is `isolateOption` or `isolateProp`
  if (!isolateOption) {
    return mainFn;
  }

  const _isolateOption =
    typeof isolateOption === 'function'
      ? isolateOption(initialProps)
      : isolateOption;

  return isolate(mainFn, _isolateOption);
}

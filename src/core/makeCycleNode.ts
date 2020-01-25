import { Stream, Subscription } from "xstream";
import {
  Drivers,
  Sources,
  Sinks,
  DisposeFunction,
  SinkProxies,
  Main
} from "@cycle/run";
import isolate from "@cycle/isolate";
import { makeFnCallEffectDriver } from "../drivers/fnCallEffectDriver";
import {
  CycleConnectOptions,
  CycleConnectOptionsProps,
  CycleMainFn,
  CycleNode,
  StatelessSinkProxies
} from "../types";
import {
  makeSinkProxies,
  wrapMain,
  maybeIsolate,
  subscribeSinkProxiesToSinks
} from "./utils";

export function makeCycleNode<P extends CycleConnectOptionsProps>(
  mainFn: CycleMainFn,
  cycleConnectOptions: CycleConnectOptions = {},
  upstreamSources: Sources<Drivers> = {},
  upstreamSinkProxies: SinkProxies<Sinks<Main>> = {},
  initialProps?: P,
  componentName?: string
): CycleNode {
  const isRootCycle = !!cycleConnectOptions.root;
  const { drivers, isolate: isolateOption } = cycleConnectOptions;

  const sinkProxies: StatelessSinkProxies<Sinks<Main>> =
    isRootCycle && drivers ? makeSinkProxies(drivers) : {};
  const childSources: Sources<Drivers> = {};
  const sinkSubscriptions: Subscription[] = [];
  const upstreamSinkSubscriptions: Subscription[] = [];
  const innerSinks: Sinks<Main> = {};

  function cycleNodeify(_mainFn: CycleMainFn): CycleMainFn {
    return function mainCycleNodeified(sources: Sources<Drivers>) {
      Object.assign(childSources, sources);
      const _innerSinks = _mainFn(sources);

      // Extend the sinkProxies with more stuff, possibly provided
      // by the other wrappers (applied on top of this wrapper)
      Object.assign(sinkProxies, makeSinkProxies(sources));
      Object.assign(innerSinks, _innerSinks);

      // Note: the actual subscription happens after we subscribed
      // to upstream sinkProxies because the proxies are stateless
      // and we want to make sure everything is wired up upfront
      // (as long as its possible).
      return sinkProxies;
    };
  }

  // Note: The "Cycle Node" wrapper should go before regular wrappers
  // so that children can see the possibly provided sources and return
  // the sinks for these wrappers.
  // "Inner" wrappers are applied first, though, as they're only working
  // in the context of the "current" Cycle program.
  // TODO: We're applying the wrappers here, but how'd we dispose
  // them in case they need to? Or is it a particular wrapper responsibility
  // to get connected to a pipeline in a way it automatically "unsubscribes"?
  // Aside: Consider how this lays out into the upcoming Cycle plugins
  // architecture.
  const wrappers = [
    ...(cycleConnectOptions._innerWrappers || []),
    cycleNodeify,
    ...(cycleConnectOptions.wrappers || [])
  ];

  const wrappedMain = wrapMain(mainFn, wrappers);
  const wrappedAndIsolatedMain = maybeIsolate(
    wrappedMain,
    isolateOption,
    isRootCycle,
    initialProps
  );

  function _internalDispose() {
    sinkSubscriptions.forEach(s => s.unsubscribe());
    upstreamSinkSubscriptions.forEach(s => s.unsubscribe());
    Object.keys(sinkProxies).forEach(name => sinkProxies[name]._c());
  }

  function subscribeToInnerSinks() {
    Array.prototype.push.apply(
      sinkSubscriptions,
      subscribeSinkProxiesToSinks(sinkProxies, innerSinks)
    );
  }

  return {
    sinkProxies,
    childSources,
    run(): DisposeFunction {
      if (isRootCycle) {
        const runFn = cycleConnectOptions.runFn;
        if (typeof runFn !== "function") {
          throw new Error(
            `You need the 'runFn' passed as configuration
            option of cycleConnect(...) when 'root' option is enabled.`
          );
        }

        const _drivers = {
          // TODO: Make `fnCallEffect` key configurable
          fnCallEffect: makeFnCallEffectDriver(),
          ...cycleConnectOptions.drivers
        };
        const _cycleDispose = runFn(wrappedAndIsolatedMain, _drivers);
        subscribeToInnerSinks();

        return function disposeContext(): void {
          _internalDispose();
          _cycleDispose();
        };
      }

      // Run the current "sub-cycle" otherwise
      const _sinks = wrappedAndIsolatedMain(upstreamSources);
      Array.prototype.push.apply(
        upstreamSinkSubscriptions,
        subscribeSinkProxiesToSinks(upstreamSinkProxies, _sinks)
      );
      subscribeToInnerSinks();

      return function disposeContext(): void {
        _internalDispose();
      };
    }
  };
}

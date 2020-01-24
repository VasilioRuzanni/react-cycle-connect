import xs from "xstream";
import isolate from "@cycle/isolate";
// [[TODO: Think about renaming SinkProxies to something else maybe
// to prevent confusing them with `@cycle/run`s SinkProxies type
// and semantics of operating on the "run" side]]
// Borrowed from `@cycle/run` itself (TODO: we might need a different type)
// TODO: How to abstract away from `xs` here?
// I mean, this is not really only internal stuff, its what drives
// the app, so the actual streams should be a particular lib streams
// (xstream, RxJS, most)
// export function makeSinkProxies<
//   So extends Sources<Drivers>,
//   Si extends Sinks<Main>
// >(driversOrSources: Drivers | So): SinkProxies<Si> {
//   const sinkProxies: SinkProxies<Si> = {} as SinkProxies<Si>;
//   // Note, that in both cases (drivers and sources) we need to preserve
//   // all `sources`'  attributes, even if they're undefined, because there
//   // might be write-only drivers that provide nothing as source, but still
//   // expect something as sinks. So, if we filter them out as being "falsy"
//   // and not create a sink proxy with that name, then we would never get
//   // a value from a program to a write-only driver.
//   for (const name in driversOrSources) {
//     if (driversOrSources.hasOwnProperty(name)) {
//       sinkProxies[name] = xs.create<any>();
//     }
//   }
//   return sinkProxies;
// }
export function makeSinkProxies(driversOrSources) {
    var sinkProxies = {};
    for (var name_1 in driversOrSources) {
        if (driversOrSources.hasOwnProperty(name_1)) {
            sinkProxies[name_1] = xs.create();
        }
    }
    return sinkProxies;
}
export function subscribeStreamToStream(stream, sourceStream, sourceName) {
    return sourceStream.subscribe({
        next: function (value) { return stream._n(value); },
        error: function (error) { return stream._e(error); },
        // tslint:disable-next-line:no-empty
        complete: function () { } // Noop
    });
}
export function subscribeSinkProxiesToSinks(sinkProxies, sinks) {
    var sinkNames = Object.keys(sinks).filter(function (name) { return !!sinkProxies[name]; });
    return sinkNames.map(function (name) {
        return subscribeStreamToStream(sinkProxies[name], xs.fromObservable(sinks[name]), name);
    });
}
export function pipeWrapper(f, g) {
    return function (mainFn) { return g(f(mainFn)); };
}
export function wrapMain(mainFn, wrappers) {
    if (wrappers === void 0) { wrappers = []; }
    if (!wrappers.length) {
        return mainFn;
    }
    var combinedWrapperFn = wrappers.reduce(pipeWrapper, function (value) { return value; });
    return combinedWrapperFn(mainFn);
}
export function maybeIsolate(mainFn, isolateOption, isRootCycle, initialProps) {
    // Rendering-level `isolate` prop, overrides component-level
    // `isolate` option
    var isolateProp = initialProps && typeof initialProps.isolate !== "undefined"
        ? initialProps.isolate
        : void 0;
    if (isolateProp) {
        isolateOption = isolateProp;
    }
    // Do nothing unless there is `isolateOption` or `isolateProp`
    if (!isolateOption) {
        return mainFn;
    }
    var _isolateOption = typeof isolateOption === "function"
        ? isolateOption(initialProps)
        : isolateOption;
    return isolate(mainFn, _isolateOption);
}
//# sourceMappingURL=utils.js.map
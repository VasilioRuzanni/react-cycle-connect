var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import { makeFnCallEffectDriver } from "../drivers/fnCallEffectDriver";
import { makeSinkProxies, wrapMain, maybeIsolate, subscribeSinkProxiesToSinks } from "./utils";
export function makeCycleNode(mainFn, cycleConnectOptions, upstreamSources, upstreamSinkProxies, initialProps, componentName) {
    if (cycleConnectOptions === void 0) { cycleConnectOptions = {}; }
    if (upstreamSources === void 0) { upstreamSources = {}; }
    if (upstreamSinkProxies === void 0) { upstreamSinkProxies = {}; }
    var isRootCycle = !!cycleConnectOptions.root;
    var drivers = cycleConnectOptions.drivers, isolateOption = cycleConnectOptions.isolate;
    var sinkProxies = isRootCycle && drivers ? makeSinkProxies(drivers) : {};
    var childSources = {};
    var sinkSubscriptions = [];
    var upstreamSinkSubscriptions = [];
    var innerSinks = {};
    function cycleNodeify(_mainFn) {
        return function mainCycleNodeified(sources) {
            Object.assign(childSources, sources);
            var _innerSinks = _mainFn(sources);
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
    var wrappers = __spreadArrays((cycleConnectOptions._innerWrappers || []), [
        cycleNodeify
    ], (cycleConnectOptions.wrappers || []));
    var wrappedMain = wrapMain(mainFn, wrappers);
    var wrappedAndIsolatedMain = maybeIsolate(wrappedMain, isolateOption, isRootCycle, initialProps);
    function _internalDispose() {
        sinkSubscriptions.forEach(function (s) { return s.unsubscribe(); });
        upstreamSinkSubscriptions.forEach(function (s) { return s.unsubscribe(); });
        Object.keys(sinkProxies).forEach(function (name) { return sinkProxies[name]._c(); });
    }
    function subscribeToInnerSinks() {
        Array.prototype.push.apply(sinkSubscriptions, subscribeSinkProxiesToSinks(sinkProxies, innerSinks));
    }
    return {
        sinkProxies: sinkProxies,
        childSources: childSources,
        run: function () {
            if (isRootCycle) {
                var runFn = cycleConnectOptions.runFn;
                if (typeof runFn !== "function") {
                    throw new Error("You need the 'runFn' passed as configuration\n            option of cycleConnect(...) when 'root' option is enabled.");
                }
                var _drivers = __assign({ 
                    // TODO: Make `fnCallEffect` key configurable
                    fnCallEffect: makeFnCallEffectDriver() }, cycleConnectOptions.drivers);
                var _cycleDispose_1 = runFn(wrappedAndIsolatedMain, _drivers);
                subscribeToInnerSinks();
                return function disposeContext() {
                    _internalDispose();
                    _cycleDispose_1();
                };
            }
            // Run the current "sub-cycle" otherwise
            var _sinks = wrappedAndIsolatedMain(upstreamSources);
            Array.prototype.push.apply(upstreamSinkSubscriptions, subscribeSinkProxiesToSinks(upstreamSinkProxies, _sinks));
            subscribeToInnerSinks();
            return function disposeContext() {
                _internalDispose();
            };
        }
    };
}
//# sourceMappingURL=makeCycleNode.js.map
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var xs = require('xstream');
var xs__default = _interopDefault(xs);
var sampleCombine = _interopDefault(require('xstream/extra/sampleCombine'));
var dropRepeats = _interopDefault(require('xstream/extra/dropRepeats'));
var isolate = _interopDefault(require('@cycle/isolate'));
var React = require('react');
var React__default = _interopDefault(React);

function makeFnCallEffectDriver() {
    return function fnCallEffectDriver(fnCallEffect$) {
        fnCallEffect$.addListener({
            next: function (fnCallEffect) {
                if (typeof fnCallEffect.fn === 'function') {
                    fnCallEffect.fn.apply(null, fnCallEffect.args);
                }
            }
        });
    };
}

// tslint:disable no-any
function makeInteractFn(interaction$) {
    return function interactFn(interactionType, predefinedValue) {
        return function (value) {
            interaction$._n({
                type: interactionType,
                value: typeof predefinedValue !== 'undefined' ? predefinedValue : value
            });
        };
    };
}

// tslint:disable no-any
function makeInteractionsProp(interactFn) {
    var interactionsPropProxyHandler = {
        get: function (target, interactionEventName) {
            return interactFn.call(null, interactionEventName);
        }
    };
    return new Proxy({}, interactionsPropProxyHandler);
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var adapt_1 = createCommonjsModule(function (module, exports) {
Object.defineProperty(exports, "__esModule", { value: true });
function getGlobal() {
    var globalObj;
    if (typeof window !== 'undefined') {
        globalObj = window;
    }
    else if (typeof commonjsGlobal !== 'undefined') {
        globalObj = commonjsGlobal;
    }
    else {
        globalObj = this;
    }
    globalObj.Cyclejs = globalObj.Cyclejs || {};
    globalObj = globalObj.Cyclejs;
    globalObj.adaptStream = globalObj.adaptStream || (function (x) { return x; });
    return globalObj;
}
function setAdapt(f) {
    getGlobal().adaptStream = f;
}
exports.setAdapt = setAdapt;
function adapt(stream) {
    return getGlobal().adaptStream(stream);
}
exports.adapt = adapt;

});

unwrapExports(adapt_1);
var adapt_2 = adapt_1.setAdapt;
var adapt_3 = adapt_1.adapt;

var DefaultInteractionsSource = /** @class */ (function () {
    function DefaultInteractionsSource(stream) {
        this._interaction$ = adapt_3(stream);
    }
    // tslint:disable-next-line no-any
    DefaultInteractionsSource.prototype.select = function (interactionSelector) {
        return this._interaction$
            .filter(function (i) {
            return i.type === interactionSelector;
        })
            .map(function (interaction) { return interaction.value; });
    };
    return DefaultInteractionsSource;
}());

function makeInteractionsWrapper() {
    var name = "interactions";
    var fnCallEffectDriverKey = "fnCallEffect"; // TODO: Make configurable
    var interaction$ = xs__default.create();
    var interactFn = makeInteractFn(interaction$);
    function interactionsWrapper(mainFn) {
        return function mainWithInteractions(sources) {
            var interactionsSource = new DefaultInteractionsSource(interaction$);
            var interactionsSourceProxyHandler = {
                // tslint:disable-next-line no-any
                get: function (target, attr) {
                    if (typeof target[attr] === "undefined") {
                        return target.select(attr);
                    }
                    return target[attr];
                }
            };
            sources[name] = new Proxy(interactionsSource, interactionsSourceProxyHandler);
            var sinks = mainFn(sources);
            var upstreamInteractions$ = sinks[name];
            // TODO: The current experimental/hacky code should be removed, though
            var propsSource = sources.props;
            if (upstreamInteractions$ && propsSource) {
                var props$ = propsSource.props$;
                var upstreamInteractionFnCall$ = upstreamInteractions$
                    .compose(sampleCombine(props$))
                    .map(function (_a) {
                    var upstreamInteractions = _a[0], props = _a[1];
                    var fnCallStreams = Object.keys(upstreamInteractions)
                        .filter(function (propName) { return typeof props[propName] === "function"; })
                        .map(function (propName) {
                        return upstreamInteractions[propName].map(function (propInteractionValue) { return ({
                            fn: props[propName],
                            args: [propInteractionValue]
                        }); });
                    });
                    return xs__default.merge.apply(null, fnCallStreams);
                })
                    .flatten();
                // TODO: We're mutating the sinks here, find out how to implement this
                // in a more safe and elegant way
                sinks[fnCallEffectDriverKey] = sinks[fnCallEffectDriverKey]
                    ? xs__default.merge(sinks[fnCallEffectDriverKey], upstreamInteractionFnCall$)
                    : upstreamInteractionFnCall$;
            }
            return sinks;
        };
    }
    return {
        interactionsWrapper: interactionsWrapper,
        interactFn: interactFn
    };
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
}

var lifecycleHookNames = [
    // "willMount",
    "didMount",
    // "willReceiveProps",
    // "willUpdate",
    "didUpdate",
    "willUnmount",
    "didCatch"
];
var ReactLifecycleSource = /** @class */ (function () {
    function ReactLifecycleSource(lifecycleStreams) {
        this.lifecycleStreams = lifecycleStreams;
    }
    return ReactLifecycleSource;
}());
lifecycleHookNames.forEach(function (hookName) {
    ReactLifecycleSource.prototype[hookName] = function () {
        return this.lifecycleStreams[hookName + "$"];
    };
});
function makeReactLifecycleWrapper() {
    var name = "lifecycle";
    var lifecycleStreams = {};
    lifecycleHookNames.forEach(function (hookName) {
        lifecycleStreams[hookName + "$"] = new xs.Stream();
    });
    function reactLifecycleWrapper(mainFn) {
        return function mainWithReactLifecycle(sources) {
            var _a;
            var _sources = __assign(__assign({}, sources), (_a = {}, _a[name] = new ReactLifecycleSource(lifecycleStreams), _a));
            return mainFn(_sources);
        };
    }
    return {
        lifecycleWrapper: reactLifecycleWrapper,
        lifecycleStreams: lifecycleStreams
    };
}

var ReactPropsSource = /** @class */ (function () {
    function ReactPropsSource(stream) {
        this._props$ = stream.compose(dropRepeats()).remember();
        this.props$ = adapt_3(this._props$);
    }
    ReactPropsSource.prototype.pluck = function (propName) {
        return this._props$
            .map(function (props) { return (props && props[propName]) || void 0; })
            .compose(dropRepeats())
            .remember();
    };
    ReactPropsSource.prototype.select = function (propSelector) {
        return new ReactPropsSource(this.pluck(propSelector));
    };
    return ReactPropsSource;
}());
function makeReactPropsWrapper(inputProps$, willUnmount$) {
    var name = "props";
    var props$ = xs__default.createWithMemory().endWhen(willUnmount$);
    function reactPropsWrapper(mainFn) {
        return function mainWithReactProps(sources) {
            var _a;
            var sinkPropsImitator$ = xs__default.create();
            var combinedProps$ = xs__default
                .merge(inputProps$, sinkPropsImitator$)
                .fold(function (combinedProps, newProps) { return (__assign(__assign({}, combinedProps), newProps)); }, void 0)
                .drop(1) // Dropping the initial `void 0`
                .remember()
                .endWhen(willUnmount$);
            var _sources = __assign(__assign({}, sources), (_a = {}, _a[name] = new ReactPropsSource(combinedProps$), _a));
            console.log("_sources", _sources);
            var sinks = mainFn(_sources);
            var propsSink = sinks[name];
            delete sinks[name];
            // Subscribe to combined props immediately to collect those in program's
            // `propsSource` so that the first subscriber immediately gets its
            // latest value.
            combinedProps$.addListener({
                next: function (value) { return props$._n(value); }
            });
            if (propsSink) {
                var sinkProps$ = xs__default.fromObservable(propsSink);
                // TODO: Imitate with .imitate() once the way to convert
                // `MemoryStream` to `Stream` is found
                // sinkPropsImitator$.imitate(sinkProps$);
                sinkProps$.endWhen(willUnmount$).addListener({
                    next: function (value) { return sinkPropsImitator$._n(value); },
                    complete: function () { return sinkPropsImitator$._c(); },
                    error: function (error) { return sinkPropsImitator$._e(error); }
                });
            }
            return sinks;
        };
    }
    return {
        propsWrapper: reactPropsWrapper,
        props$: props$
    };
}

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
function makeSinkProxies(driversOrSources) {
    var sinkProxies = {};
    for (var name_1 in driversOrSources) {
        if (driversOrSources.hasOwnProperty(name_1)) {
            sinkProxies[name_1] = xs__default.create();
        }
    }
    return sinkProxies;
}
function subscribeStreamToStream(stream, sourceStream, sourceName) {
    return sourceStream.subscribe({
        next: function (value) { return stream._n(value); },
        error: function (error) { return stream._e(error); },
        // tslint:disable-next-line:no-empty
        complete: function () { } // Noop
    });
}
function subscribeSinkProxiesToSinks(sinkProxies, sinks) {
    var sinkNames = Object.keys(sinks).filter(function (name) { return !!sinkProxies[name]; });
    return sinkNames.map(function (name) {
        return subscribeStreamToStream(sinkProxies[name], xs__default.fromObservable(sinks[name]), name);
    });
}
function pipeWrapper(f, g) {
    return function (mainFn) { return g(f(mainFn)); };
}
function wrapMain(mainFn, wrappers) {
    if (wrappers === void 0) { wrappers = []; }
    if (!wrappers.length) {
        return mainFn;
    }
    var combinedWrapperFn = wrappers.reduce(pipeWrapper, function (value) { return value; });
    return combinedWrapperFn(mainFn);
}
function maybeIsolate(mainFn, isolateOption, isRootCycle, initialProps) {
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

function makeCycleNode(mainFn, cycleConnectOptions, upstreamSources, upstreamSinkProxies, initialProps, componentName) {
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

var CONTEXT_TYPES = {
    cycleNodeLink: function () { return null; }
};
function noopMainFn(sources) {
    return {};
}
function defaultRenderFn(props) {
    return props.children || null;
}
function cycleConnect(mainFn, options) {
    if (options === void 0) { options = {}; }
    var _mainFn;
    if (typeof mainFn === "object") {
        options = mainFn;
        _mainFn = noopMainFn;
    }
    if (typeof mainFn === "function") {
        _mainFn = mainFn;
    }
    return function makeComponent(WrappedComponent) {
        var _a;
        var sourceComponentName = (options.render && "customRenderFn") ||
            (WrappedComponent &&
                (WrappedComponent.displayName ||
                    WrappedComponent.name ||
                    "AnonymousComponent")) ||
            "defaultRenderFn";
        var displayName = options.displayName || "cycleConnect(" + sourceComponentName + ")";
        var shouldUpdateFn = options.shouldUpdate || (function (x) { return true; });
        return _a = /** @class */ (function (_super) {
                __extends(CycleConnectContainer, _super);
                function CycleConnectContainer(props, context) {
                    var _this = _super.call(this, props, context) || this;
                    var cycleNodeLink = context.cycleNodeLink;
                    var sources = (cycleNodeLink && cycleNodeLink.sources) || {};
                    var sinkProxies = (cycleNodeLink && cycleNodeLink.sinkProxies) || {};
                    // Configuring internal wrappers
                    // React component lifecycle
                    var _a = makeReactLifecycleWrapper(), lifecycleWrapper = _a.lifecycleWrapper, lifecycleStreams = _a.lifecycleStreams;
                    _this.lifecycleStreams = lifecycleStreams;
                    // React props
                    _this.inputProps$ = xs__default.createWithMemory().startWith(props);
                    var _b = makeReactPropsWrapper(_this.inputProps$, _this.lifecycleStreams.willUnmount$), propsWrapper = _b.propsWrapper, props$ = _b.props$;
                    _this.props$ = props$;
                    // Interactions
                    var _c = makeInteractionsWrapper(), interactionsWrapper = _c.interactionsWrapper, interactFn = _c.interactFn;
                    _this.interactFn = interactFn;
                    _this.interactionsProp = makeInteractionsProp(interactFn);
                    var _options = __assign(__assign({}, options), { _innerWrappers: [interactionsWrapper, propsWrapper, lifecycleWrapper] });
                    _this.cycleNode = makeCycleNode(_mainFn, _options, sources, sinkProxies, props, displayName);
                    _this.disposeCycleNode = _this.cycleNode.run();
                    return _this;
                }
                CycleConnectContainer.prototype.getChildContext = function () {
                    var cn = this.cycleNode;
                    if (!cn) {
                        return {};
                    }
                    return {
                        cycleNodeLink: {
                            sources: cn.childSources,
                            sinkProxies: cn.sinkProxies
                        }
                    };
                };
                // componentWillMount() {
                //   this.subscribeToPropsUpdates();
                //   this.lifecycleStreams.willMount$._n(null);
                // }
                CycleConnectContainer.prototype.componentDidMount = function () {
                    //   this.lifecycleStreams.willMount$._n(null);
                    this.subscribeToPropsUpdates(shouldUpdateFn);
                    this.lifecycleStreams.didMount$._n(null);
                };
                // componentWillReceiveProps(nextProps: Readonly<TOuterProps>) {
                //   this.lifecycleStreams.willReceiveProps$._n(nextProps);
                // }
                // NOTE: Not passing `nextState` intentionally, keep the state
                // inside the "connected" Cycle program instead.
                // componentWillUpdate(nextProps: Readonly<TOuterProps>) {
                //   this.lifecycleStreams.willUpdate$._n(nextProps);
                // }
                CycleConnectContainer.prototype.componentDidUpdate = function (prevProps) {
                    this.lifecycleStreams.didUpdate$._n(prevProps);
                };
                CycleConnectContainer.prototype.componentWillUnmount = function () {
                    this.lifecycleStreams.willUnmount$._n(null);
                    if (this.disposeCycleNode) {
                        this.disposeCycleNode();
                    }
                };
                CycleConnectContainer.prototype.componentDidCatch = function (error, errorInfo) {
                    this.lifecycleStreams.didCatch$._n({ error: error, errorInfo: errorInfo });
                };
                CycleConnectContainer.prototype.subscribeToPropsUpdates = function (shouldUpdateFn) {
                    var _this = this;
                    console.log("susbcribed to props updates", displayName);
                    this.props$.endWhen(this.lifecycleStreams.willUnmount$).addListener({
                        next: function (props) {
                            console.log("next", displayName);
                            console.log("previous prop?", _this.propsSnapshot);
                            console.log("got a new prop", props);
                            var update = shouldUpdateFn(_this.propsSnapshot, props);
                            console.log("shouldUpdate", update);
                            _this.propsSnapshot = props;
                            update && _this.forceUpdate();
                        }
                    });
                };
                CycleConnectContainer.prototype.render = function () {
                    var props = __assign(__assign({}, this.propsSnapshot), { interact: this.interactFn, interactions: this.interactionsProp });
                    if (typeof options.render === "function") {
                        return options.render(props);
                    }
                    return WrappedComponent
                        ? React__default.createElement(WrappedComponent, props)
                        : defaultRenderFn(props);
                };
                return CycleConnectContainer;
            }(React.PureComponent)), _a.contextTypes = CONTEXT_TYPES, _a.childContextTypes = CONTEXT_TYPES, _a.displayName = displayName, _a;
    };
}

var Isolator = cycleConnect({
    isolate: function (props) { return props.scope || void 0; },
    displayName: 'Isolator'
})();

exports.Isolator = Isolator;
exports.cycleConnect = cycleConnect;
exports.makeFnCallEffectDriver = makeFnCallEffectDriver;
exports.makeInteractFn = makeInteractFn;
exports.makeInteractionsProp = makeInteractionsProp;
exports.makeInteractionsWrapper = makeInteractionsWrapper;
exports.ReactLifecycleSource = ReactLifecycleSource;
exports.makeReactLifecycleWrapper = makeReactLifecycleWrapper;
exports.ReactPropsSource = ReactPropsSource;
exports.makeReactPropsWrapper = makeReactPropsWrapper;
//# sourceMappingURL=index.js.map

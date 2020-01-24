var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import React, { PureComponent } from "react";
import xs from "xstream";
import { makeCycleNode } from "./core/makeCycleNode";
import { makeReactPropsWrapper } from "./wrappers/reactPropsWrapper";
import { makeReactLifecycleWrapper } from "./wrappers/reactLifecycleWrapper";
import { makeInteractionsWrapper, makeInteractionsProp } from "./interactions";
var CONTEXT_TYPES = {
    cycleNodeLink: function () { return null; }
};
function noopMainFn(sources) {
    return {};
}
function defaultRenderFn(props) {
    return props.children || null;
}
export function cycleConnect(mainFn, options) {
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
                    _this.inputProps$ = xs.createWithMemory().startWith(props);
                    var _b = makeReactPropsWrapper(_this.inputProps$, _this.lifecycleStreams.willUnmount$), propsWrapper = _b.propsWrapper, props$ = _b.props$;
                    _this.props$ = props$;
                    // Interactions
                    var _c = makeInteractionsWrapper(), interactionsWrapper = _c.interactionsWrapper, interactFn = _c.interactFn;
                    _this.interactFn = interactFn;
                    _this.interactionsProp = makeInteractionsProp(interactFn);
                    var _options = __assign(__assign({}, options), { _innerWrappers: [interactionsWrapper, propsWrapper, lifecycleWrapper] });
                    _this.cycleNode = makeCycleNode(_mainFn, _options, sources, sinkProxies, props, displayName);
                    _this.subscribeToPropsUpdates();
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
                CycleConnectContainer.prototype.subscribeToPropsUpdates = function () {
                    var _this = this;
                    console.log("susbcribed to props updates");
                    this.props$.endWhen(this.lifecycleStreams.willUnmount$).addListener({
                        next: function (props) {
                            console.log("got a new prop", props);
                            _this.propsSnapshot = props;
                            _this.forceUpdate();
                        }
                    });
                };
                CycleConnectContainer.prototype.render = function () {
                    var props = __assign(__assign({}, this.propsSnapshot), { interact: this.interactFn, interactions: this.interactionsProp });
                    if (typeof options.render === "function") {
                        return options.render(props);
                    }
                    return WrappedComponent
                        ? React.createElement(WrappedComponent, props)
                        : defaultRenderFn(props);
                };
                return CycleConnectContainer;
            }(PureComponent)),
            _a.contextTypes = CONTEXT_TYPES,
            _a.childContextTypes = CONTEXT_TYPES,
            _a.displayName = displayName,
            _a;
    };
}
//# sourceMappingURL=cycleConnect.js.map
import xs from "xstream";
import sampleCombine from "xstream/extra/sampleCombine";
import { DefaultInteractionsSource } from "./DefaultInteractionsSource";
import { makeInteractFn } from "./makeInteractFn";
export function makeInteractionsWrapper() {
    var name = "interactions";
    var fnCallEffectDriverKey = "fnCallEffect"; // TODO: Make configurable
    var interaction$ = xs.create();
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
                    return xs.merge.apply(null, fnCallStreams);
                })
                    .flatten();
                // TODO: We're mutating the sinks here, find out how to implement this
                // in a more safe and elegant way
                sinks[fnCallEffectDriverKey] = sinks[fnCallEffectDriverKey]
                    ? xs.merge(sinks[fnCallEffectDriverKey], upstreamInteractionFnCall$)
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
//# sourceMappingURL=interactionsWrapper.js.map
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
import xs from "xstream";
import dropRepeats from "xstream/extra/dropRepeats";
import { adapt } from "@cycle/run/lib/adapt";
var ReactPropsSource = /** @class */ (function () {
    function ReactPropsSource(stream) {
        this._props$ = stream.compose(dropRepeats()).remember();
        this.props$ = adapt(this._props$);
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
export { ReactPropsSource };
export function makeReactPropsWrapper(inputProps$, willUnmount$) {
    var name = "props";
    var props$ = xs.createWithMemory().endWhen(willUnmount$);
    function reactPropsWrapper(mainFn) {
        return function mainWithReactProps(sources) {
            var _a;
            var sinkPropsImitator$ = xs.create();
            var combinedProps$ = xs
                .merge(inputProps$, sinkPropsImitator$)
                .fold(function (combinedProps, newProps) { return (__assign(__assign({}, combinedProps), newProps)); }, void 0)
                .drop(1) // Dropping the initial `void 0`
                .remember()
                .endWhen(willUnmount$);
            var _sources = __assign(__assign({}, sources), (_a = {}, _a[name] = new ReactPropsSource(combinedProps$), _a));
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
                var sinkProps$ = xs.fromObservable(propsSink);
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
//# sourceMappingURL=reactPropsWrapper.js.map
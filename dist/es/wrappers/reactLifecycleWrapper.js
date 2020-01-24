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
import { Stream } from "xstream";
var lifecycleHookNames = [
    "willMount",
    "didMount",
    "willReceiveProps",
    "willUpdate",
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
export { ReactLifecycleSource };
lifecycleHookNames.forEach(function (hookName) {
    ReactLifecycleSource.prototype[hookName] = function () {
        return this.lifecycleStreams[hookName + "$"];
    };
});
export function makeReactLifecycleWrapper() {
    var name = "lifecycle";
    var lifecycleStreams = {};
    lifecycleHookNames.forEach(function (hookName) {
        lifecycleStreams[hookName + "$"] = new Stream();
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
//# sourceMappingURL=reactLifecycleWrapper.js.map
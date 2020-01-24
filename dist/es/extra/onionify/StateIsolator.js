import { cycleConnect } from "react-cycle-connect";
// TODO Assuming the use of `@cycle/state` for now,
// make configurable, since @cycle/state itself supports that.
var DEFAULT_STATE_CHANNEL_NAME = "state";
export var StateIsolator = cycleConnect({
    isolate: function (props) {
        var _a;
        return (_a = {},
            _a[props.channelName || DEFAULT_STATE_CHANNEL_NAME] = props.lens || void 0,
            _a["*"] = null,
            _a);
    },
    displayName: "StateIsolator"
})();
export default StateIsolator;
//# sourceMappingURL=StateIsolator.js.map
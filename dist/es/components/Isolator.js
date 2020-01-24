import { cycleConnect } from '../cycleConnect';
export var Isolator = cycleConnect({
    isolate: function (props) { return props.scope || void 0; },
    displayName: 'Isolator'
})();
export default Isolator;
//# sourceMappingURL=Isolator.js.map
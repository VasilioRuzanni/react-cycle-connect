// tslint:disable no-any
export function makeInteractionsProp(interactFn) {
    var interactionsPropProxyHandler = {
        get: function (target, interactionEventName) {
            return interactFn.call(null, interactionEventName);
        }
    };
    return new Proxy({}, interactionsPropProxyHandler);
}
//# sourceMappingURL=makeInteractionsProp.js.map
// tslint:disable no-any
export function makeInteractFn(interaction$) {
    return function interactFn(interactionType, predefinedValue) {
        return function (value) {
            interaction$._n({
                type: interactionType,
                value: typeof predefinedValue !== 'undefined' ? predefinedValue : value
            });
        };
    };
}
//# sourceMappingURL=makeInteractFn.js.map
export function makeFilteredListLens(stateProp, filterPredicate, equals) {
    var mapStateProp = function (state) { return state[stateProp]; };
    var equalsFn = typeof equals === "function"
        ? equals
        : function (item1, item2) {
            return typeof item1 === "object" &&
                typeof item2 === "object" &&
                item1[equals] === item2[equals];
        };
    return {
        get: function (state) {
            return mapStateProp(state).filter(function (item) { return filterPredicate(item, state); });
        },
        set: function (state, nextFilteredItems) {
            var _a;
            var arr = mapStateProp(state);
            var prevFilteredItems = arr.filter(function (item) {
                return filterPredicate(item, state);
            });
            // TODO: Use spread operator once it works in TypeScript:
            // Tracked by: https://github.com/Microsoft/TypeScript/issues/10727
            // Fixed by (unmerged): https://github.com/Microsoft/TypeScript/pull/13288
            return Object.assign({}, state, (_a = {},
                _a[stateProp] = arr
                    .map(function (item) { return nextFilteredItems.find(function (i) { return equalsFn(i, item); }) || item; })
                    .filter(function (item) {
                    return prevFilteredItems.some(function (i) { return equalsFn(i, item); }) &&
                        nextFilteredItems.some(function (i) { return equalsFn(i, item); });
                }),
                _a));
        }
    };
}
//# sourceMappingURL=makeFilteredListLens.js.map
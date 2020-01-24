'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var reactCycleConnect = require('react-cycle-connect');
var React = _interopDefault(require('react'));
var xs = _interopDefault(require('xstream'));

// TODO Assuming the use of `@cycle/state` for now,
// make configurable, since @cycle/state itself supports that.
var DEFAULT_STATE_CHANNEL_NAME = "state";
var StateIsolator = reactCycleConnect.cycleConnect({
    isolate: function (props) {
        var _a;
        return (_a = {}, _a[props.channelName || DEFAULT_STATE_CHANNEL_NAME] = props.lens || void 0, _a["*"] = null, _a);
    },
    displayName: "StateIsolator"
})();

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

// TODO Assuming the use of `@cycle/state` for now,
// make configurable, since onionify itself supports that,
// so that it could be set globally, without the need for
// every component to explicitly specify the `channelName`.
var DEFAULT_STATE_CHANNEL_NAME$1 = "state";
function defaultItemIsolate(props) {
    return { "*": null };
}
// Note: Reusing the `@cycle/state`s lens implementation almost as is.
function itemLens(itemKeyFn, key) {
    return {
        get: function (arr) {
            if (typeof arr === "undefined")
                return void 0;
            for (var i = 0, n = arr.length; i < n; ++i) {
                if (itemKeyFn(arr[i], i) === key) {
                    return arr[i];
                }
            }
            return void 0;
        },
        set: function (arr, item) {
            if (typeof arr === "undefined") {
                return [item];
            }
            else if (typeof item === "undefined") {
                return arr.filter(function (s, i) { return itemKeyFn(s, i) !== key; });
            }
            return arr.map(function (s, i) {
                if (itemKeyFn(s, i) === key)
                    return item;
                return s;
            });
        }
    };
}
function main(sources) {
    var state$ = xs.fromObservable(sources.props
        .pluck("channelName")
        .map(function (channelName) {
        return sources[channelName || DEFAULT_STATE_CHANNEL_NAME$1].stream;
    })
        .flatten());
    return {
        props: state$.map(function (items) { return ({ items: items }); })
    };
}
function makeDefaultItemRender(opts) {
    var ItemComponent = opts.itemComponent;
    var _a = opts.channelName, channelName = _a === void 0 ? DEFAULT_STATE_CHANNEL_NAME$1 : _a, itemKeyFn = opts.itemKeyFn, itemIsolate = opts.itemIsolate;
    return function defaultItemRender(itemState, itemKey, index) {
        var _a, _b;
        var stateScope = itemKeyFn ? itemLens(itemKeyFn, itemKey) : index;
        var itemScope = itemIsolate || defaultItemIsolate;
        var otherScopes = typeof itemScope === "function"
            ? itemScope(itemState)
            : itemScope;
        var itemIsolateProp = typeof otherScopes === "object"
            ? __assign(__assign({}, otherScopes), (_a = {}, _a[channelName] = stateScope, _a)) : (_b = { "*": otherScopes }, _b[channelName] = stateScope, _b);
        return (React.createElement(ItemComponent, __assign({ key: itemKey }, itemState, { isolate: itemIsolateProp })));
    };
}
function render(props) {
    var items = props.items, itemKeyFn = props.itemKeyFn, itemRender = props.itemRender, itemComponent = props.itemComponent;
    if (!items)
        return null;
    if (!itemRender && !itemComponent) {
        throw new Error('You need either "itemRender" or "itemComponent" attribute ' +
            "defined on a <Collection>");
    }
    var _itemRender = itemRender || makeDefaultItemRender(props);
    return items.map(function (itemState, index) {
        var itemKey = itemKeyFn ? itemKeyFn(itemState, index) : index;
        return _itemRender(itemState, itemKey, index);
    });
}
var cycleConnectOpts = {
    isolate: function (props) {
        var _a;
        return (_a = {}, _a[props.channelName || DEFAULT_STATE_CHANNEL_NAME$1] = props.lens || void 0, _a["*"] = null, _a);
    },
    render: render,
    displayName: "Collection"
};
var Collection = reactCycleConnect.cycleConnect(main, cycleConnectOpts)();

function makeFilteredListLens(stateProp, filterPredicate, equals) {
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
            return Object.assign({}, state, (_a = {}, _a[stateProp] = arr
                    .map(function (item) { return nextFilteredItems.find(function (i) { return equalsFn(i, item); }) || item; })
                    .filter(function (item) {
                    return prevFilteredItems.some(function (i) { return equalsFn(i, item); }) &&
                        nextFilteredItems.some(function (i) { return equalsFn(i, item); });
                }), _a));
        }
    };
}

exports.StateIsolator = StateIsolator;
exports.Collection = Collection;
exports.makeFilteredListLens = makeFilteredListLens;
//# sourceMappingURL=index.js.map

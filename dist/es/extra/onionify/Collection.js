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
import React from "react";
import xs from "xstream";
import { cycleConnect } from "react-cycle-connect";
// TODO Assuming the use of `@cycle/state` for now,
// make configurable, since onionify itself supports that,
// so that it could be set globally, without the need for
// every component to explicitly specify the `channelName`.
var DEFAULT_STATE_CHANNEL_NAME = "state";
export function defaultItemIsolate(props) {
    return { "*": null };
}
// Note: Reusing the `@cycle/state`s lens implementation almost as is.
export function itemLens(itemKeyFn, key) {
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
export function main(sources) {
    var state$ = xs.fromObservable(sources.props
        .pluck("channelName")
        .map(function (channelName) {
        return sources[channelName || DEFAULT_STATE_CHANNEL_NAME].stream;
    })
        .flatten());
    return {
        props: state$.map(function (items) { return ({ items: items }); })
    };
}
function makeDefaultItemRender(opts) {
    var ItemComponent = opts.itemComponent;
    var _a = opts.channelName, channelName = _a === void 0 ? DEFAULT_STATE_CHANNEL_NAME : _a, itemKeyFn = opts.itemKeyFn, itemIsolate = opts.itemIsolate;
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
        return (_a = {},
            _a[props.channelName || DEFAULT_STATE_CHANNEL_NAME] = props.lens || void 0,
            _a["*"] = null,
            _a);
    },
    render: render,
    displayName: "Collection"
};
export var Collection = cycleConnect(main, cycleConnectOpts)();
//# sourceMappingURL=Collection.js.map
import React, { Key, ComponentType, ReactNode } from "react";
import { Stream } from "xstream";
import { Scope, Lens } from "@cycle/state";
import { ReactPropsSource, IsolateOption } from "react-cycle-connect";
export declare type ItemKeyFn<TItemState> = (itemState: TItemState, index?: number) => Key;
export interface CollectionProps {
    lens: Scope<any, any>;
    channelName?: string;
    itemKeyFn?: <TItemState>(itemState: TItemState, index?: number) => Key;
    itemIsolate?: IsolateOption;
    itemComponent?: ComponentType;
    itemRender?: <TItemState>(itemProps: TItemState, itemKey?: Key, index?: number) => ReactNode;
}
export interface ViewProps<TItemState> extends CollectionProps {
    items: TItemState[];
}
export interface Sources {
    props: ReactPropsSource<CollectionProps>;
}
export interface Sinks<TItemState> {
    props: Stream<{
        items: TItemState[];
    }>;
}
export declare function defaultItemIsolate<TProps>(props: TProps): {
    "*": null;
};
export declare function itemLens(itemKeyFn: ItemKeyFn<any>, key: Key): Lens<any[], any>;
export declare function main(sources: Sources): Sinks<any>;
export declare const Collection: React.ComponentClass<CollectionProps, any>;

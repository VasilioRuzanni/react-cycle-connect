import { Lens } from "@cycle/state";
export declare type EqualsFn<TItemState> = (item1: TItemState, item2: TItemState) => boolean;
export declare function makeFilteredListLens<TState extends {}, TItemState>(stateProp: string, filterPredicate: (item: TItemState, state: TState) => boolean, equals: string | EqualsFn<TItemState>): Lens<TState, TItemState[]>;

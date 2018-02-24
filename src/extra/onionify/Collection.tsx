import React, { Children, Key, ComponentType, ReactNode } from 'react';
import xs, { Stream } from 'xstream';
import { StateSource, Scope, Lens } from 'cycle-onionify';
import {
  cycleConnect,
  ReactPropsSource,
  CycleConnectedProps,
  CycleConnectOptionsProps,
  IsolateOption,
  IsolateOptionFn
} from 'react-cycle-connect';

// TODO: Reconsider the implementation to make it more TypeScript-friendly

export type ItemKeyFn<TItemState> = (
  itemState: TItemState,
  index?: number
) => Key;

export interface CollectionProps {
  // TODO: Think how to make it typed easily, given
  // the Collection component is universal, not bound
  // to a particular item state type.
  lens: Scope<any, any>;
  channelName?: string;
  itemKeyFn?: <TItemState>(itemState: TItemState, index?: number) => Key;
  itemIsolate?: IsolateOption;
  itemComponent?: ComponentType;
  itemRender?: <TItemState>(
    itemProps: TItemState,
    itemKey?: Key,
    index?: number
  ) => ReactNode;
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

// TODO Assuming the use of `cycle-onionify` for now,
// make configurable, since onionify itself supports that,
// so that it could be set globally, without the need for
// every component to explicitly specify the `channelName`.
const DEFAULT_STATE_CHANNEL_NAME = 'onion';

export function defaultItemIsolate<TProps>(props: TProps) {
  return { '*': null };
}

// Note: Reusing the `cycle-onionify`s lens implementation almost as is.
export function itemLens(
  itemKeyFn: ItemKeyFn<any>,
  key: Key
): Lens<any[], any> {
  return {
    get(arr: Array<any> | undefined): any {
      if (typeof arr === 'undefined') return void 0;
      for (let i = 0, n = arr.length; i < n; ++i) {
        if (itemKeyFn(arr[i], i) === key) {
          return arr[i];
        }
      }
      return void 0;
    },

    set(arr: Array<any> | undefined, item: any): any {
      if (typeof arr === 'undefined') {
        return [item];
      } else if (typeof item === 'undefined') {
        return arr.filter((s, i) => itemKeyFn(s, i) !== key);
      }
    
      return arr.map((s, i) => {
        if (itemKeyFn(s, i) === key) return item;
        return s;
      });
    }
  };
}

export function main(sources: Sources): Sinks<any> {
  const state$ = xs.fromObservable(
    sources.props
      .pluck('channelName')
      .map(
        (channelName?: string) =>
          (sources[channelName || DEFAULT_STATE_CHANNEL_NAME] as StateSource<
            any
          >).state$
      )
      .flatten()
  );

  return {
    props: state$.map((items: any[]) => ({ items }))
  };
}

interface MakeDefaultItemRenderOpts<TItemState> extends CollectionProps {
  itemComponent: ComponentType<TItemState>;
}

function makeDefaultItemRender<TItemState extends CycleConnectOptionsProps>(
  opts: MakeDefaultItemRenderOpts<TItemState>
) {
  const ItemComponent = opts.itemComponent;
  const {
    channelName = DEFAULT_STATE_CHANNEL_NAME,
    itemKeyFn,
    itemIsolate
  } = opts;

  return function defaultItemRender(
    itemState: TItemState,
    itemKey: Key,
    index: number
  ): ReactNode {
    const onionScope = itemKeyFn ? itemLens(itemKeyFn, itemKey) : index;
    const itemScope = itemIsolate || defaultItemIsolate;
    const otherScopes = typeof itemScope === 'function'
      ? (itemScope as IsolateOptionFn<TItemState>)(itemState)
      : itemScope;

    const itemIsolateProp = typeof otherScopes === 'object'
      ? { ...otherScopes, [channelName]: onionScope }
      : { '*': otherScopes, [channelName]: onionScope };

    return (
      <ItemComponent
        key={itemKey}
        {...itemState}
        isolate={itemIsolateProp}
      />
    );
  };
}

function render<TItemState>(props: ViewProps<TItemState>) {
  const {
    items,
    itemKeyFn,
    itemRender,
    itemComponent
  } = props;

  if (!items) return null;
  if (!itemRender && !itemComponent) {
    throw new Error(
      'You need either "itemRender" or "itemComponent" attribute ' +
      'defined on a <Collection>'
    );
  }

  const _itemRender = itemRender || makeDefaultItemRender(props as any);
  return items.map((itemState: TItemState, index: number) => {
    const itemKey = itemKeyFn ? itemKeyFn(itemState, index) : index;
    return _itemRender(itemState, itemKey, index);
  });
}

const cycleConnectOpts = {
  isolate: (props: CollectionProps) => ({
    [props.channelName || DEFAULT_STATE_CHANNEL_NAME]: props.lens || void 0,
    '*': null
  }),
  render,
  displayName: 'Collection'
};

export const Collection = cycleConnect(main, cycleConnectOpts)();

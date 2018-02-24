import { Lens } from 'cycle-onionify';

export type EqualsFn<TItemState> =
  (item1: TItemState, item2: TItemState) => boolean;

export function makeFilteredListLens<TState extends {}, TItemState>(
  stateProp: string,
  filterPredicate: (item: TItemState, state: TState) => boolean,
  equals: string | EqualsFn<TItemState>
): Lens<TState, TItemState[]> {
  const mapStateProp = (state: TState) => state[stateProp] as TItemState[];
  const equalsFn = typeof equals === 'function'
    ? equals
    : (item1: TItemState, item2: TItemState) =>
      typeof item1 === 'object'
      && typeof item2 === 'object'
      && item1[equals] === item2[equals];

  return {
    get: (state: TState) => {
      return mapStateProp(state).filter(item => filterPredicate(item, state));
    },

    set: (state: TState, nextFilteredItems: TItemState[]) => {
      const arr = mapStateProp(state);
      const prevFilteredItems = arr.filter(item => filterPredicate(item, state));

      // TODO: Use spread operator once it works in TypeScript:
      // Tracked by: https://github.com/Microsoft/TypeScript/issues/10727
      // Fixed by (unmerged): https://github.com/Microsoft/TypeScript/pull/13288
      return Object.assign({}, state, {
        [stateProp]: arr
          .map(item => nextFilteredItems.find(i => equalsFn(i, item)) || item)
          .filter(
            item =>
              prevFilteredItems.some(i => equalsFn(i, item)) &&
              nextFilteredItems.some(i => equalsFn(i, item))
          )
      });
    }
  };
}

import xs, { Stream, MemoryStream } from 'xstream';
import React, { ReactElement } from 'react';
import { StyleSheet, TouchableOpacity, View, Text, GestureResponderEvent } from 'react-native';
import { h, ReactSource } from '@cycle/react';
import { cycleConnect, InteractionsSource, CycleConnectedProps } from 'react-cycle-connect';
import { StateSource, Reducer } from '@cycle/state';

export type CounterProps = {};

export interface CounterState {
  count: number;
}

export interface ViewProps extends CycleConnectedProps<InteractionEvents> {
  label: string;
  count: number;
}

export interface Sources {
  interactions: InteractionsSource<InteractionEvents>;
  state: StateSource<any>;
}

export interface Sinks {
  props: Stream<{ [name: string]: any }>;
  state: Stream<Reducer<CounterState>>;
}

export interface InteractionEvents {
  incrementPress: GestureResponderEvent;
}

interface ModelActions {
  increment$: Stream<GestureResponderEvent>;
}

function intent(interactions: InteractionsSource<InteractionEvents>) {
  return {
    increment$: interactions.incrementPress
  };
}

function model(actions: ModelActions): Stream<Reducer<CounterState>> {
  // Note: default reducer assumes that we always have a valid
  // state from the parent component. It just makes it undefined
  // explicitly otherwise.
  const defaultReducer$ = xs.of(function defaultReducer(state: CounterState) {
    if (state) return state;
    return { count: 0 };
  });

  const incrementReducer$ = (actions.increment$ as Stream<GestureResponderEvent>).map(
    () => (state: CounterState) => ({
      ...state,
      count: state.count + 1
    })
  );

  return xs.merge(defaultReducer$, incrementReducer$);
}

function main(sources: Sources): Sinks {
  const state$ = sources.state.stream as Stream<CounterState>;
  const actions = intent(sources.interactions);
  const reducer$ = model(actions);

  return {
    props: state$,
    state: reducer$
  };
}

const Counter = ({ label = 'counter', count, interactions }: ViewProps) => (
  <TouchableOpacity style={styles.container} onPress={interactions.incrementPress}>
    <Text>
      {label} : {count}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontWeight: 'bold'
  }
});

export default cycleConnect(main)(Counter);

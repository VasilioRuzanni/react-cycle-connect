import xs, { Stream } from 'xstream';
import React, { ReactElement } from 'react';
import { TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Main } from '@cycle/run';
import { h, ReactSource } from '@cycle/react';
import {
  cycleConnect,
  InteractionsSource,
  CycleConnectedProps,
  Isolator
} from 'react-cycle-connect';
import { StateSource, Reducer } from '@cycle/state';

import isolate from '@cycle/isolate';
import { StateIsolator } from 'react-cycle-connect/lib/extra/onionify';

import Counter from '../components/Counter';
import { Link } from '../routing';

import { StyleSheet, View, Text } from 'react-native';

export interface CountersState {
  top: { count: number };
  bottom: { count: number };
  sum: number;
}

export interface Sources {
  interactions: InteractionsSource<InteractionEvents>;
  state: StateSource<CountersState>;
}

export interface Sinks {
  props: Stream<Partial<ViewProps>>;
  state: Stream<Reducer<CountersState>>;
}

export interface InteractionEvents {
  change: GestureResponderEvent;
}

interface ModelActions {
  change$: Stream<GestureResponderEvent>;
}

export interface ViewProps extends CycleConnectedProps<InteractionEvents> {
  sum: number;
}

function intent(interactions: InteractionsSource<InteractionEvents>) {
  return {
    change$: interactions.change
  };
}

function model(actions: ModelActions): Stream<Reducer<CountersState>> {
  const defaultReducer$ = xs.of(function defaultReducer(state: CountersState) {
    if (typeof state !== 'undefined') return state;
    return {
      top: { count: 0 },
      bottom: { count: 0 },
      sum: 0
    };
  });

  const changeReducer$ = (actions.change$ as Stream<GestureResponderEvent>).map(
    () => (state: CountersState) => ({
      ...state,
      top: { count: 42 }
    })
  );

  return xs.merge(defaultReducer$, changeReducer$);
}

function main(sources: Sources): Sinks {
  const state$ = sources.state.stream as Stream<CountersState>;
  const actions = intent(sources.interactions);
  // // const sum$ = state$.map(({ top, bottom }) => top + bottom).debug(x => console.log('sum$', x));
  const reducer$ = model(actions);

  const sum$ = state$.map(({ top, bottom }: CountersState) => ({
    top,
    bottom,
    sum: top.count + bottom.count
  }));

  return {
    state: reducer$,
    props: sum$
  };
}

const Counters = ({ sum = 0, interactions }: ViewProps) => (
  <View style={styles.container}>
    <StateIsolator lens="top">
      <Counter label="Top Counter" />
    </StateIsolator>
    <StateIsolator lens="bottom">
      <Counter label="Bottom Counter" />
    </StateIsolator>
    <Text style={styles.container}>Sum is {sum}</Text>
    <TouchableOpacity onPress={interactions.change}>
      <Text>Set Top counter to 42</Text>
    </TouchableOpacity>
    <View style={styles.container}>
      <Link to="/">
        <Text style={styles.link}>Back</Text>
      </Link>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center'
  },
  link: {
    fontSize: 20,
    textDecorationLine: 'underline'
  }
});

export default cycleConnect(main)(Counters);

import xs, { Stream } from 'xstream';
import React, { ReactElement } from 'react';
import { h, ReactSource } from '@cycle/react';
import { Sources, Drivers, Sinks, Main } from '@cycle/run';
import isolate from '@cycle/isolate';
import Counter from '../components/Counter';

import { cycleConnect, InteractionsSource, CycleConnectedProps } from 'react-cycle-connect';

import { StyleSheet, View, Text } from 'react-native';

import { Link } from '../routing';

function main(sources: Sources<Drivers>): Sinks<Main> {
  return {};
}

const Welcome = () => (
  <View style={styles.container}>
    <Link to="/counter">
      <Text style={styles.link}>Counter</Text>
    </Link>
    <Link to="/counters">
      <Text style={styles.link}>Counters</Text>
    </Link>
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

export default cycleConnect(main)(Welcome);

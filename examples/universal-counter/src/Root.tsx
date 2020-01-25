import React, { ReactElement } from 'react';

import { ReactSource, makeComponent } from '@cycle/react';

import xs, { Stream } from 'xstream';

import { Route, Router, Link } from './routing';
import { StyleSheet, View, Text } from 'react-native';
import { Switch } from 'react-native-web-ui-components';
import Welcome from './screens/Welcome';
import Counter from './components/Counter';
import Counters from './screens/Counters';

const CounterWithBackLink = () => (
  <View style={styles.container}>
    <Counter label="Top level component counter" />
    <View style={styles.container}>
      <Link to="/">
        <Text style={styles.link}>Back</Text>
      </Link>
    </View>
  </View>
);

const Root = () => (
  <Router>
    <Route exact path="/" component={Welcome} />
    <Route path="/counters" component={Counters} />
    <Route path="/counter" component={CounterWithBackLink} />
  </Router>
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

export default Root;

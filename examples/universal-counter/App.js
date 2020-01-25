import React from 'react';

import * as Font from 'expo-font';

import Root from './src/Root';
import Main from './src/Main';

class Index extends React.Component {
  state = {
    fontLoaded: false
  };

  async componentDidMount() {
    await Font.loadAsync({
      'Lucida Sans': require('./assets/fonts/Lucida-Sans.ttf'),
      'Lucida Sans Bold': require('./assets/fonts/Lucida-Sans-Bold.ttf')
    });
    this.setState({ fontLoaded: true });
  }

  render() {
    const { fontLoaded } = this.state;
    if (fontLoaded) {
      return (
        <Main>
          <Root />
        </Main>
      );
    }
    return null;
  }
}

export default Index;

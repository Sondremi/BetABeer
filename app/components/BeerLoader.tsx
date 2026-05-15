import React from 'react';
import { Image, View } from 'react-native';
import { globalStyles } from '../styles/globalStyles';

const BeerLoader = () => (
  <View style={[globalStyles.container, globalStyles.centerContent]}>
    <Image
      source={require('../../assets/images/beer-filling-up.gif')}
      style={{ width: 160, height: 160 }}
      resizeMode="contain"
    />
  </View>
);

export default BeerLoader;

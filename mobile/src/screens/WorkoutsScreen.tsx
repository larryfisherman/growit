import { View, Text, StyleSheet } from 'react-native';

export default function WorkoutsScreen() {
  return (
    <View style={styles.container}>
      <Text>Dzisiaj</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

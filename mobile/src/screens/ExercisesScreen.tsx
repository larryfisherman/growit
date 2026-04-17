import { View, Text, StyleSheet } from 'react-native';

export default function ExercisesScreen() {
  return (
    <View style={styles.container}>
      <Text>Ćwiczenia</Text>
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

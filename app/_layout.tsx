import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';

const convex = new ConvexReactClient("https://ideal-penguin-725.convex.cloud"); 

function RootStack() {
  return (
    <>
      <Stack screenOptions={{
        headerShown: false
      }}>
        <Stack.Screen name="Home" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <SafeAreaProvider style={styles.container}>
        <Toaster />
        {/* <Navi0gationContainer> */}
        <RootStack />
        {/* </NavigationContainer> */}
      </SafeAreaProvider>
    </ConvexProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none"
  }
});


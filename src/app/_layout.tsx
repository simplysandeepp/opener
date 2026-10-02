import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AppLockProvider } from '../contexts/AppLockContext';
import { TabsProvider } from '../contexts/TabsContext';

function RootNavigator() {
  const { isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#121212' : '#ffffff',
        },
        headerTintColor: isDark ? '#ffffff' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Opener',
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AppLockProvider>
      <ThemeProvider>
        <TabsProvider>
          <RootNavigator />
        </TabsProvider>
      </ThemeProvider>
    </AppLockProvider>
  );
}

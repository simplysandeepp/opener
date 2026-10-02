import { Stack } from 'expo-router';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AppLockProvider } from '../contexts/AppLockContext';
import { TabsProvider } from '../contexts/TabsContext';
import { useIncomingFileIntent } from '../hooks/useIncomingFileIntent';

function RootNavigator() {
  const { isDark } = useTheme();
  useIncomingFileIntent();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#0a0a0c' : '#ffffff',
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

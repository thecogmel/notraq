/* eslint-disable */
// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (cb) => {},
  Link: ({ children }) => children,
  Redirect: () => null,
}));

// Mock lucide-react-native
jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  const icon = (name) => {
    const Icon = (props) => <View testID={`icon-${name}`} {...props} />;
    Icon.displayName = name;
    return Icon;
  };
  return new Proxy({}, { get: (_, prop) => icon(String(prop)) });
});

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
    Svg: View,
    Circle: View,
    Polyline: View,
    Path: View,
    Defs: View,
    LinearGradient: View,
    Stop: View,
    Text: View,
  };
});

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: { scanFromURLAsync: jest.fn() },
  CameraView: 'CameraView',
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: () => ({}),
}));

// Mock db client
jest.mock('@/db/client', () => ({
  db: {},
  useDatabaseMigrations: () => ({ success: true, error: null }),
}));

// Mock nativewind
jest.mock('nativewind', () => ({
  useColorScheme: () => ({ colorScheme: 'dark' }),
}));

// Mock @rn-primitives/slot
jest.mock('@rn-primitives/slot', () => {
  const { View, Text } = require('react-native');
  return {
    Slot: View,
    TextSlot: Text,
  };
});

// Mock class-variance-authority
jest.mock('class-variance-authority', () => ({
  cva: () => () => '',
}));

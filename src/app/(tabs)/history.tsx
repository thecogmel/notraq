import { Redirect } from 'expo-router';

/**
 * Legacy history tab — now hidden via `href: null` in _layout.tsx.
 * Redirects to the markets tab if somehow navigated to directly.
 */
export default function HistoryScreen() {
  return <Redirect href="/(tabs)/markets" />;
}

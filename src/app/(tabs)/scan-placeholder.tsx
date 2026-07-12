import { Redirect } from 'expo-router';

// Este arquivo existe apenas para registrar a tab do FAB.
// O press é interceptado no _layout para abrir /scan como modal.
export default function ScanPlaceholder() {
  return <Redirect href="/scan" />;
}

import { createContext, useContext } from 'react';

import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { openDatabaseSync } from 'expo-sqlite';

import migrations from './migrations/migrations';
import * as schema from './schema';

const DATABASE_NAME = 'notraq.db';

const expoDb = openDatabaseSync(DATABASE_NAME);
export const db = drizzle(expoDb, { schema });

export type Database = typeof db;

const DatabaseContext = createContext<Database>(db);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  return useContext(DatabaseContext);
}

export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}

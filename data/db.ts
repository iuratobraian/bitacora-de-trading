
import { UserProfile, Account, Trade } from "../types";

// ESTE ARCHIVO ACTÚA COMO LA BASE DE DATOS CENTRAL (SEMILLA)
// Si ENCRYPTED_DB_SEED tiene contenido, la app lo usará preferentemente y lo desencriptará al iniciar.
// Si está vacío, usará INITIAL_DB (datos por defecto).

export interface DatabaseSchema {
  users: UserProfile[];
  accounts: Account[];
  activeAccountId: string;
  trades: Record<string, Trade[]>; // key: userId_accountId
}

// 1. BASE DE DATOS ENCRIPTADA (Prioridad Alta)
export const ENCRYPTED_DB_SEED: string = "";

// 2. DATOS POR DEFECTO (Se cargan Elias y Admin como base del sistema)
// NOTA: Se usan UUIDs válidos para evitar rechazo en Backend SQL estricto
export const INITIAL_DB: DatabaseSchema = {
  users: [
    {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // UUID válido para Admin
      name: 'Admin',
      pin: '221707', // Clave Maestra
      role: 'ADMIN',
      createdAt: '2024-01-01T00:00:00.000Z',
      avatar: '🛡️'
    },
    {
      id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380b22', // UUID válido para Elias
      name: 'Elias',
      pin: '1234', // Clave solicitada
      role: 'USER',
      createdAt: new Date().toISOString(),
      avatar: '📈'
    }
  ],
  accounts: [
    {
      id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33', // UUID válido para Cuenta Default
      name: 'Cuenta Principal',
      startingBalance: 10000,
      currency: 'USD',
      createdAt: '2024-01-01T00:00:00.000Z'
    }
  ],
  activeAccountId: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
  trades: {}
};

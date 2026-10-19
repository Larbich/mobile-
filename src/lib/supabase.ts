/**
 * Deprecated in local-first mode.
 * Kept as a compatibility shim for legacy imports.
 */

export const isSupabaseConfigured = false;

function unsupported() {
  throw new Error('Supabase is disabled in local-first mode.');
}

export const supabase: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithOAuth: async () => unsupported(),
    setSession: async () => unsupported(),
  },
  from: () => ({
    select: () => unsupported(),
    insert: () => unsupported(),
    update: () => unsupported(),
    delete: () => unsupported(),
    upsert: () => unsupported(),
  }),
  functions: {
    invoke: async () => unsupported(),
  },
};

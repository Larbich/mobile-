export function getComposioClient() {
  throw new Error('Composio backend is disabled in local-first mode.');
}

export function getSupabaseAdminClient() {
  throw new Error('Supabase backend is disabled in local-first mode.');
}

export async function validateUserFromRequest(
  _req: Request,
  bodyUserId?: string
): Promise<{ userId: string; userEmail?: string; token?: string }> {
  if (bodyUserId) {
    return { userId: bodyUserId };
  }

  return { userId: 'local-user' };
}

export async function startToolConnection() {
  throw new Error('Tool connection backend is disabled in local-first mode.');
}

export async function checkToolConnectionStatus() {
  throw new Error('Tool connection backend is disabled in local-first mode.');
}

export async function disconnectToolConnection() {
  throw new Error('Tool connection backend is disabled in local-first mode.');
}

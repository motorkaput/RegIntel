import { getTokenFromCookies, verifyJWT, JWTPayload } from './jwt';

export interface ServerSession {
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export async function getServerSession(): Promise<ServerSession | null> {
  try {
    const token = getTokenFromCookies();
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload) return null;

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;

    return {
      userId: payload.sub,
      tenantId: payload.tenant_id,
      role: payload.role,
      email: payload.email,
    };
  } catch (error) {
    console.error('Failed to get server session:', error);
    return null;
  }
}

export async function requireAuth(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Authentication required');
  }
  return session;
}

export function isValidSession(session: ServerSession | null): session is ServerSession {
  return session !== null && 
         typeof session.userId === 'string' && 
         typeof session.tenantId === 'string' && 
         typeof session.role === 'string' && 
         typeof session.email === 'string';
}
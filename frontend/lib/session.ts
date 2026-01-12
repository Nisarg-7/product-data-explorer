import { v4 as uuidv4 } from 'uuid';

const SESSION_ID_KEY = 'product_explorer_session_id';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
}

export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_ID_KEY);
  }
}

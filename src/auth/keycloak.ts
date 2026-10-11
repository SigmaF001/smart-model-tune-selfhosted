import Keycloak, { type KeycloakTokenParsed } from "keycloak-js";

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface AuthProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  profile: AuthProfile | null;
}

interface TuneLabClaims extends KeycloakTokenParsed {
  email?: string;
  name?: string;
  preferred_username?: string;
  display_name?: string;
  avatar_url?: string;
  picture?: string;
}

const keycloak = new Keycloak({
  url: import.meta.env.VITE_AUTH_URL || "/auth",
  realm: import.meta.env.VITE_AUTH_REALM || "tunelab",
  clientId: import.meta.env.VITE_AUTH_CLIENT_ID || "tunelab-web",
});

const listeners = new Set<(state: AuthState) => void>();
let initPromise: Promise<boolean> | null = null;

function claims(): TuneLabClaims | null {
  return (keycloak.tokenParsed as TuneLabClaims | undefined) ?? null;
}

export function getAuthState(): AuthState {
  const token = claims();
  if (!keycloak.authenticated || !token?.sub) return { user: null, profile: null };
  const email = token.email ?? null;
  return {
    user: { id: token.sub, email },
    profile: {
      id: token.sub,
      user_id: token.sub,
      display_name: token.display_name ?? token.name ?? token.preferred_username ?? null,
      avatar_url: token.avatar_url ?? token.picture ?? null,
    },
  };
}

function emit(): void {
  const state = getAuthState();
  for (const listener of listeners) listener(state);
}

keycloak.onAuthSuccess = emit;
keycloak.onAuthRefreshSuccess = emit;
keycloak.onAuthLogout = emit;
keycloak.onTokenExpired = () => {
  void keycloak.updateToken(30).then(emit).catch(() => {
    keycloak.clearToken();
    emit();
  });
};

export function initAuth(): Promise<boolean> {
  initPromise ??= keycloak.init({
    onLoad: "check-sso",
    pkceMethod: "S256",
    checkLoginIframe: false,
  });
  return initPromise;
}

export function subscribeAuth(listener: (state: AuthState) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function getAccessToken(): Promise<string | null> {
  if (!keycloak.authenticated) return null;
  await keycloak.updateToken(30);
  return keycloak.token ?? null;
}

export function safeRedirectPath(path = '/dashboard'): string {
  try {
    const url = new URL(path, window.location.origin)
    if (url.origin !== window.location.origin || !path.startsWith('/') || path.startsWith('//')) return '/dashboard'
    if (/^\/(login|signup|mfa|forgot-password|reset-password)(\/|$)/.test(url.pathname)) return '/dashboard'
    return url.pathname + url.search + url.hash
  } catch {
    return '/dashboard'
  }
}

export function signIn(redirectPath = "/dashboard"): Promise<void> {
  return initAuth().then(() => keycloak.login({ redirectUri: window.location.origin + safeRedirectPath(redirectPath) }))
}

export function register(redirectPath = "/dashboard"): Promise<void> {
  return initAuth().then(() => keycloak.register({ redirectUri: window.location.origin + safeRedirectPath(redirectPath) }))
}

export async function signOut(): Promise<void> {
  await initAuth()
  const logoutUrl = keycloak.createLogoutUrl({ redirectUri: window.location.origin + '/' })
  clearLocalAuth()
  window.location.assign(logoutUrl)
}

export function manageAccount(): Promise<void> {
  return initAuth().then(() => keycloak.accountManagement())
}

export function clearLocalAuth(): void {
  keycloak.clearToken();
  emit();
}

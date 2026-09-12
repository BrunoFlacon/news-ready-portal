/**
 * Utilitários de OAuth (portado de client/src/const.ts da landing).
 * Gera a URL de login em runtime para que o redirectUri reflita a origem atual.
 */

import { COOKIE_NAME, ONE_YEAR_MS } from "@/lib/constants";

export { COOKIE_NAME, ONE_YEAR_MS };

export const getLoginUrl = () => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};
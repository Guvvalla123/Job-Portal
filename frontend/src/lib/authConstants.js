/**
 * Shared auth storage keys - used by AuthContext and apiClient.
 * Single source of truth prevents mismatches (e.g. 'accessToken' vs 'AccessToken').
 */
export const AUTH_KEYS = {
  USER: 'currentUser',
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
}

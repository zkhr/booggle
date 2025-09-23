export type CookieName = "color" | "nick" | "token" | "theme";

export function saveCookieValue(key: CookieName, value: string) {
  document.cookie = key + "=" + value +
    ";path=/;expires=Fri, 31 Dec 9999 23:59:59 GMT";
}

/**
 * Loads a value from the user's cookies. If no value is found, return the
 * default instead.
 */
export function getCookieValue(key: CookieName, defaultValue: string) {
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const [k, v] = part.split("=");
    if (k === key) {
      return v;
    }
  }
  return defaultValue;
}

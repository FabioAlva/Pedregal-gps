import { auth } from "#layers/auth-admin/server/lib/auth";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
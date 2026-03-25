<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { resolveBestAuthorizedFrontendRoute } from '~/lib/post-login-route'

const { data: session } = await authClient.useSession(useFetch);

if (session.value) {
	// Después del login, vamos al dashboard principal
	await navigateTo('/dashboard', { replace: true })
} else {
	await navigateTo('/login', { replace: true });
}
</script>

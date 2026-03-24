<script setup lang="ts">
import { authClient } from "~/lib/auth-client";
import { resolveBestAuthorizedFrontendRoute } from '~/lib/post-login-route'

const { data: session } = await authClient.useSession(useFetch);

if (session.value) {
	const targetRoute = await resolveBestAuthorizedFrontendRoute()
	if (targetRoute) {
		await navigateTo(targetRoute, { replace: true })
	} else {
		await navigateTo('/login', { replace: true })
	}
} else {
	await navigateTo("/login", { replace: true });
}
</script>

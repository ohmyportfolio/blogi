import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getSiteSettings } from "@/lib/site-settings";

const LoginPage = async () => {
    const settings = await getSiteSettings();
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <LoginForm siteName={settings.siteName || undefined} />
        </Suspense>
    );
}

export default LoginPage;

import { RegisterForm } from "@/components/auth/register-form";
import { getSiteSettings } from "@/lib/site-settings";

const RegisterPage = async () => {
    const settings = await getSiteSettings();
    return (
        <RegisterForm siteName={settings.siteName || undefined} />
    );
}

export default RegisterPage;

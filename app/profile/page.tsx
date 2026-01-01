import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile/profile-form";

const ProfilePage = async () => {
    const session = await auth();

    if (!session?.user) {
        redirect("/login?callbackUrl=/profile");
    }

    return <ProfileForm user={session.user} />;
};

export default ProfilePage;

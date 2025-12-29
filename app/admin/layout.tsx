import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (session?.user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <div className="w-full md:w-64 bg-[#0b1320] text-white p-6">
                <h2 className="font-display text-2xl mb-6 md:mb-8">Admin Dashboard</h2>
                <nav className="flex flex-wrap gap-2 md:block md:space-y-4">
                    <Link href="/admin" className="block p-2 hover:bg-gray-800 rounded">
                        Overview
                    </Link>
                    <Link href="/admin/users" className="block p-2 hover:bg-gray-800 rounded">
                        Users
                    </Link>
                    <Link href="/admin/products" className="block p-2 hover:bg-gray-800 rounded">
                        Products
                    </Link>
                    <Link href="/admin/menus" className="block p-2 hover:bg-gray-800 rounded">
                        Menus
                    </Link>
                    <Link href="/admin/site-settings" className="block p-2 hover:bg-gray-800 rounded">
                        Site Settings
                    </Link>
                    <Link href="/admin/footer" className="block p-2 hover:bg-gray-800 rounded">
                        Footer
                    </Link>
                    <Link href="/" className="block p-2 text-gray-400 hover:text-white md:mt-8">
                        Back to Site
                    </Link>
                </nav>
            </div>
            <div className="flex-1 p-4 md:p-8 bg-gray-100 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

import { auth } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

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
        <div className="flex min-h-screen">
            <div className="w-64 bg-gray-900 text-white p-6">
                <h2 className="text-xl font-bold mb-8">Admin Dashboard</h2>
                <nav className="space-y-4">
                    <Link href="/admin" className="block p-2 hover:bg-gray-800 rounded">
                        Overview
                    </Link>
                    <Link href="/admin/users" className="block p-2 hover:bg-gray-800 rounded">
                        Users
                    </Link>
                    <Link href="/admin/products" className="block p-2 hover:bg-gray-800 rounded">
                        Products
                    </Link>
                    <Link href="/" className="block p-2 text-gray-400 hover:text-white mt-8">
                        Back to Site
                    </Link>
                </nav>
            </div>
            <div className="flex-1 p-8 bg-gray-100 overflow-y-auto">
                {children}
            </div>
        </div>
    );
}

"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { login, demoLogin } from "@/actions/login";
import { Eye, EyeOff } from "lucide-react";

export const LoginForm = ({ siteName, demoMode }: { siteName?: string; demoMode?: boolean }) => {
    const { showToast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const rawCallbackUrl = searchParams.get("callbackUrl");
    const callbackUrl =
        rawCallbackUrl && rawCallbackUrl.startsWith("/") ? rawCallbackUrl : "/";

    const form = useForm<z.infer<typeof LoginSchema>>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof LoginSchema>) => {
        startTransition(async () => {
            const result = await login(values, callbackUrl);
            if (result?.error) {
                if (result.code === "PENDING_APPROVAL") {
                    showToast(result.error, "info");
                } else {
                    showToast(result.error, "error");
                }
                return;
            }

            showToast(result?.success ?? "로그인 성공!", "success");
            const nextUrl = result?.redirectTo ?? callbackUrl;
            window.location.href = nextUrl;
        });
    };

    return (
        <CardWrapper
            siteName={siteName}
            headerLabel="로그인"
            backButtonLabel="계정이 없으신가요?"
            backButtonHref="/register"
        >
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-6"
                >
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>이메일</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="example@email.com"
                                            type="email"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>비밀번호</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                {...field}
                                                disabled={isPending}
                                                placeholder="******"
                                                type={showPassword ? "text" : "password"}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button
                        disabled={isPending}
                        type="submit"
                        className="w-full"
                    >
                        로그인
                    </Button>
                </form>
            </Form>
            {demoMode && (
                <div className="mt-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                    <div className="mb-3 text-center">
                        <span className="inline-block rounded-full bg-blue-500 px-3 py-0.5 text-xs font-semibold text-white">
                            DEMO MODE
                        </span>
                        <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            체험용 데모 환경입니다. 아래 버튼을 눌러 관리자 기능을 체험해보세요.
                        </p>
                    </div>
                    <Button
                        disabled={isPending}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                            startTransition(async () => {
                                const result = await demoLogin(callbackUrl);
                                if (result?.error) {
                                    showToast(result.error, "error");
                                    return;
                                }
                                showToast(result?.success ?? "로그인 성공!", "success");
                                window.location.href = result?.redirectTo ?? callbackUrl;
                            });
                        }}
                    >
                        관리자 계정으로 로그인
                    </Button>
                </div>
            )}
        </CardWrapper>
    );
};

"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
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
import { login } from "@/actions/login";

export const LoginForm = ({ siteName }: { siteName?: string }) => {
    const { showToast } = useToast();
    const [isPending, startTransition] = useTransition();
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
                                        <Input
                                            {...field}
                                            disabled={isPending}
                                            placeholder="******"
                                            type="password"
                                        />
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
        </CardWrapper>
    );
};

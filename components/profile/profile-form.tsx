"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition, useState } from "react";
import { UpdateNameSchema, UpdatePasswordSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { updateName } from "@/actions/update-name";
import { updatePassword } from "@/actions/update-password";
import { deleteAccount } from "@/actions/delete-account";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { Eye, EyeOff } from "lucide-react";

interface ProfileFormProps {
    user: Session["user"];
}

export const ProfileForm = ({ user }: ProfileFormProps) => {
    const { showToast } = useToast();
    const router = useRouter();
    const [isPendingName, startNameTransition] = useTransition();
    const [isPendingPassword, startPasswordTransition] = useTransition();
    const [isPendingDelete, startDeleteTransition] = useTransition();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const nameForm = useForm<z.infer<typeof UpdateNameSchema>>({
        resolver: zodResolver(UpdateNameSchema),
        defaultValues: {
            name: user.name || "",
        },
    });

    const passwordForm = useForm<z.infer<typeof UpdatePasswordSchema>>({
        resolver: zodResolver(UpdatePasswordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const onNameSubmit = (values: z.infer<typeof UpdateNameSchema>) => {
        startNameTransition(async () => {
            const result = await updateName(values);
            if (result?.error) {
                showToast(result.error, "error");
                return;
            }
            showToast(result?.success ?? "이름이 변경되었습니다.", "success");
            router.refresh();
        });
    };

    const onPasswordSubmit = (values: z.infer<typeof UpdatePasswordSchema>) => {
        startPasswordTransition(async () => {
            const result = await updatePassword(values);
            if (result?.error) {
                showToast(result.error, "error");
                return;
            }
            showToast(result?.success ?? "비밀번호가 변경되었습니다.", "success");
            passwordForm.reset();
        });
    };

    const onDeleteAccount = () => {
        startDeleteTransition(async () => {
            const result = await deleteAccount();
            if (result?.error) {
                showToast(result.error, "error");
                setShowDeleteConfirm(false);
                return;
            }
            showToast(result?.success ?? "회원 탈퇴가 완료되었습니다.", "success");
            // 홈으로 리다이렉트
            router.push("/");
        });
    };

    return (
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-[radial-gradient(800px_500px_at_20%_0%,rgba(14,165,166,0.2),transparent_60%),radial-gradient(700px_420px_at_85%_10%,rgba(255,107,87,0.2),transparent_60%)] py-8 px-4">
            <div className="w-full max-w-[600px] mx-4 space-y-6">
                <Card className="shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] border-0 bg-white/90">
                    <CardHeader>
                        <h2 className="text-2xl font-display">프로필 정보</h2>
                        <p className="text-muted-foreground text-sm">
                            이름을 변경할 수 있습니다
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Form {...nameForm}>
                            <form
                                onSubmit={nameForm.handleSubmit(onNameSubmit)}
                                className="space-y-6"
                            >
                                <FormField
                                    control={nameForm.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>이름</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    disabled={isPendingName}
                                                    placeholder="홍길동"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    disabled={isPendingName}
                                    type="submit"
                                    className="w-full"
                                >
                                    {isPendingName ? "변경 중..." : "이름 변경"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card className="shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] border-0 bg-white/90">
                    <CardHeader>
                        <h2 className="text-2xl font-display">비밀번호 변경</h2>
                        <p className="text-muted-foreground text-sm">
                            보안을 위해 현재 비밀번호를 입력해주세요
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Form {...passwordForm}>
                            <form
                                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                                className="space-y-6"
                            >
                                <div className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>현재 비밀번호</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            disabled={isPendingPassword}
                                                            placeholder="******"
                                                            type={showCurrentPassword ? "text" : "password"}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            {showCurrentPassword ? (
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
                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>새 비밀번호</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            disabled={isPendingPassword}
                                                            placeholder="******"
                                                            type={showNewPassword ? "text" : "password"}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            {showNewPassword ? (
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
                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>새 비밀번호 확인</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            disabled={isPendingPassword}
                                                            placeholder="******"
                                                            type={showConfirmPassword ? "text" : "password"}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            {showConfirmPassword ? (
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
                                    disabled={isPendingPassword}
                                    type="submit"
                                    className="w-full"
                                >
                                    {isPendingPassword ? "변경 중..." : "비밀번호 변경"}
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card className="shadow-[0_30px_60px_-40px_rgba(15,23,42,0.4)] border-0 bg-white/90 border-red-200">
                    <CardHeader>
                        <h2 className="text-2xl font-display text-red-600">회원 탈퇴</h2>
                        <p className="text-muted-foreground text-sm">
                            계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다
                        </p>
                    </CardHeader>
                    <CardContent>
                        {!showDeleteConfirm ? (
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full"
                            >
                                회원 탈퇴
                            </Button>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800 font-semibold mb-2">
                                        정말로 탈퇴하시겠습니까?
                                    </p>
                                    <p className="text-sm text-red-600">
                                        이 작업은 되돌릴 수 없으며, 작성한 게시글, 댓글 등 모든 데이터가 삭제됩니다.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isPendingDelete}
                                        className="flex-1"
                                    >
                                        취소
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={onDeleteAccount}
                                        disabled={isPendingDelete}
                                        className="flex-1"
                                    >
                                        {isPendingDelete ? "탈퇴 처리 중..." : "확인 - 탈퇴하기"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

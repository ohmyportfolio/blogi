import * as z from "zod";

export const LoginSchema = z.object({
    email: z.string().email({
        message: "Email is required",
    }),
    password: z.string().min(1, {
        message: "Password is required",
    }),
});

export const RegisterSchema = z.object({
    email: z.string().email({
        message: "이메일을 입력해주세요",
    }),
    password: z.string().min(6, {
        message: "비밀번호는 최소 6자 이상이어야 합니다",
    }),
    confirmPassword: z.string().min(1, {
        message: "비밀번호 확인을 입력해주세요",
    }),
    name: z.string().min(1, {
        message: "이름을 입력해주세요",
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
});

export const UpdateNameSchema = z.object({
    name: z.string().min(1, {
        message: "이름을 입력해주세요",
    }),
});

export const UpdatePasswordSchema = z.object({
    currentPassword: z.string().min(1, {
        message: "현재 비밀번호를 입력해주세요",
    }),
    newPassword: z.string().min(6, {
        message: "새 비밀번호는 최소 6자 이상이어야 합니다",
    }),
    confirmPassword: z.string().min(1, {
        message: "비밀번호 확인을 입력해주세요",
    }),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
});

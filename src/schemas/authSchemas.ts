import { z } from "zod";

export const registerSchema = z
    .object({
        email: z
            .string({ error: "Email là bắt buộc" })
            .email("Email không đúng định dạng")
            .transform((v) => v.trim().toLowerCase()),
        password: z
            .string({ error: "Password là bắt buộc" })
            .min(8, "Mật khẩu phải ít nhất 8 ký tự"),
        confirmPassword: z.string({ error: "Xác nhận mật khẩu là bắt buộc" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu xác nhận không khớp",
        path: ["confirmPassword"],
    });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z
        .string({ error: "Email là bắt buộc" })
        .email("Email không đúng định dạng")
        .transform((v) => v.trim().toLowerCase()),
    password: z.string({ error: "Password là bắt buộc" }).min(1, "Password là bắt buộc"),
});

export type LoginInput = z.infer<typeof loginSchema>;

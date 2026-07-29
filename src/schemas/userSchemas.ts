import { z } from "zod";

const emailField = z
    .string({ error: "Email là bắt buộc" })
    .email("Email không đúng định dạng")
    .transform((v) => v.trim().toLowerCase());

export const updateMyProfileSchema = z
    .object({
        email: emailField.optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8, "Mật khẩu mới ít nhất 8 ký tự").optional(),
    })
    .refine(
        (data) => !(data.newPassword && !data.currentPassword),
        { message: "Cần mật khẩu hiện tại để đổi mật khẩu", path: ["currentPassword"] },
    );

export const adminUpdateUserSchema = z.object({
    email: emailField.optional(),
    role: z.enum(["admin", "user"]).optional(),
    newPassword: z.string().min(8, "Mật khẩu mới ít nhất 8 ký tự").optional(),
});

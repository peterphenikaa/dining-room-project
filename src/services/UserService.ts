import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { AuthIdentity } from "../entity/AuthIdentity";
import { User, UserRole } from "../entity/User";
import { AppError } from "../utils/AppError";

const userRepo = () => AppDataSource.getRepository(User);
const identityRepo = () => AppDataSource.getRepository(AuthIdentity);

export type UserProfile = {
    id: string;
    email: string;
    role: UserRole;
    hasPassword: boolean;
    identities: Array<{
        id: string;
        provider: string;
        providerSubject: string;
        email: string | null;
        displayName: string | null;
        givenName: string | null;
        familyName: string | null;
        avatarUrl: string | null;
        locale: string | null;
        createdAt: Date;
    }>;
};

function toProfile(user: User, identities: AuthIdentity[]): UserProfile {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        hasPassword: Boolean(user.passwordHash),
        identities: identities.map((i) => ({
            id: i.id,
            provider: i.provider,
            providerSubject: i.providerSubject,
            email: i.email,
            displayName: i.displayName,
            givenName: i.givenName,
            familyName: i.familyName,
            avatarUrl: i.avatarUrl,
            locale: i.locale,
            createdAt: i.createdAt,
        })),
    };
}

async function loadIdentities(userId: string) {
    return identityRepo().find({
        where: { userId },
        order: { createdAt: "ASC" },
    });
}

export class UserService {
    static async getProfile(userId: string): Promise<UserProfile> {
        const user = await userRepo().findOneBy({ id: userId });
        if (!user) throw new AppError("Không tìm thấy người dùng", 404);
        return toProfile(user, await loadIdentities(userId));
    }

    static async listProfiles(): Promise<UserProfile[]> {
        const users = await userRepo().find({ order: { email: "ASC" } });
        const result: UserProfile[] = [];
        for (const user of users) {
            result.push(toProfile(user, await loadIdentities(user.id)));
        }
        return result;
    }

    static async updateMyProfile(
        userId: string,
        input: { email?: string; currentPassword?: string; newPassword?: string },
    ): Promise<UserProfile> {
        const user = await userRepo().findOneBy({ id: userId });
        if (!user) throw new AppError("Không tìm thấy người dùng", 404);

        if (input.email && input.email !== user.email) {
            const taken = await userRepo().findOneBy({ email: input.email });
            if (taken) throw new AppError("Email đã được sử dụng", 409);
            user.email = input.email;
        }

        if (input.newPassword) {
            if (user.passwordHash) {
                if (!input.currentPassword) {
                    throw new AppError("Cần mật khẩu hiện tại", 400);
                }
                const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
                if (!ok) throw new AppError("Mật khẩu hiện tại không đúng", 401);
            }
            user.passwordHash = await bcrypt.hash(input.newPassword, 10);
        }

        await userRepo().save(user);
        return toProfile(user, await loadIdentities(user.id));
    }

    static async adminUpdate(
        actorId: string,
        targetId: string,
        input: { email?: string; role?: UserRole; newPassword?: string },
    ): Promise<UserProfile> {
        const user = await userRepo().findOneBy({ id: targetId });
        if (!user) throw new AppError("Không tìm thấy người dùng", 404);

        if (input.email && input.email !== user.email) {
            const taken = await userRepo().findOneBy({ email: input.email });
            if (taken) throw new AppError("Email đã được sử dụng", 409);
            user.email = input.email;
        }

        if (input.role) {
            if (actorId === targetId && input.role !== "admin") {
                throw new AppError("Không thể tự hạ quyền admin của chính mình", 400);
            }
            user.role = input.role;
        }

        if (input.newPassword) {
            user.passwordHash = await bcrypt.hash(input.newPassword, 10);
        }

        await userRepo().save(user);
        return toProfile(user, await loadIdentities(user.id));
    }

    static async adminDelete(actorId: string, targetId: string): Promise<void> {
        if (actorId === targetId) {
            throw new AppError("Không thể xóa chính tài khoản đang đăng nhập", 400);
        }
        const user = await userRepo().findOneBy({ id: targetId });
        if (!user) throw new AppError("Không tìm thấy người dùng", 404);
        await userRepo().remove(user);
    }
}

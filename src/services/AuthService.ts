import bcrypt from "bcryptjs";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { AppError } from "../utils/AppError";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

const userRepository = AppDataSource.getRepository(User);

function toPublicUser(user: User) {
    return {
        id: user.id,
        email: user.email,
        role: user.role,
    };
}

function issueTokenPair(user: User) {
    const publicUser = toPublicUser(user);
    return {
        accessToken: signAccessToken(publicUser),
        refreshToken: signRefreshToken(publicUser),
        user: publicUser,
    };
}

export class AuthService {
    static async register(email: string, password: string) {
        const existing = await userRepository.findOneBy({ email });
        if (existing) {
            throw new AppError("Email đã được sử dụng", 409);
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = userRepository.create({
            email,
            passwordHash,
            role: "user",
        });
        const saved = await userRepository.save(user);
        return issueTokenPair(saved);
    }

    static async login(email: string, password: string) {
        const user = await userRepository.findOneBy({ email });
        if (!user) {
            throw new AppError("Email hoặc mật khẩu không đúng", 401);
        }
        if (!user.passwordHash) {
            throw new AppError("Tài khoản này đăng nhập bằng Google", 401);
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            throw new AppError("Email hoặc mật khẩu không đúng", 401);
        }

        return issueTokenPair(user);
    }

    static async refresh(refreshToken: string) {
        const { id } = verifyRefreshToken(refreshToken);
        const user = await userRepository.findOneBy({ id });
        if (!user) {
            throw new AppError("Không tìm thấy người dùng", 404);
        }
        return issueTokenPair(user);
    }

    static async getMe(userId: string) {
        const user = await userRepository.findOneBy({ id: userId });
        if (!user) {
            throw new AppError("Không tìm thấy người dùng", 404);
        }
        return toPublicUser(user);
    }
}

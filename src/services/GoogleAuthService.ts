import {
    assertGoogleOAuthConfigured,
    googleConfig,
    googleOauthScopes,
} from "../config/env";
import { takeGoogleOAuthPending, saveGoogleOAuthPending } from "../auth/googleOAuthPending";
import { AppDataSource } from "../data-source";
import { AuthIdentity } from "../entity/AuthIdentity";
import { User } from "../entity/User";
import { AppError } from "../utils/AppError";
import { createPkcePair, randomUrlSafe } from "../utils/pkce";
import { signAccessToken, signRefreshToken } from "../utils/jwt";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export type GoogleIdentity = {
    sub: string;
    email: string;
    emailVerified: boolean;
    displayName: string | null;
    givenName: string | null;
    familyName: string | null;
    avatarUrl: string | null;
    locale: string | null;
};

type GoogleTokenResponse = {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
};

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

function applyGoogleProfile(target: AuthIdentity, identity: GoogleIdentity) {
    target.email = identity.email;
    target.displayName = identity.displayName;
    target.givenName = identity.givenName;
    target.familyName = identity.familyName;
    target.avatarUrl = identity.avatarUrl;
    target.locale = identity.locale;
}

export class GoogleAuthService {
    static async buildAuthorizationUrl(opts?: { linkUserId?: string }): Promise<string> {
        assertGoogleOAuthConfigured();

        const state = randomUrlSafe(24);
        const { codeVerifier, codeChallenge } = createPkcePair();

        await saveGoogleOAuthPending(state, {
            codeVerifier,
            createdAt: Date.now(),
            ...(opts?.linkUserId ? { linkUserId: opts.linkUserId } : {}),
        });

        const params = new URLSearchParams({
            client_id: googleConfig.clientId,
            redirect_uri: googleConfig.redirectUri,
            response_type: "code",
            scope: googleOauthScopes().join(" "),
            state,
            code_challenge: codeChallenge,
            code_challenge_method: "S256",
            prompt: "select_account",
        });

        return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    }

    static async handleCallback(code: string, state: string) {
        assertGoogleOAuthConfigured();

        const pending = await takeGoogleOAuthPending(state);
        if (!pending) {
            throw new AppError("State OAuth không hợp lệ hoặc đã hết hạn", 400);
        }

        const mode = pending.linkUserId ? ("link" as const) : ("login" as const);
        const tokens = await this.exchangeCode(code, pending.codeVerifier);
        const identity = await this.resolveGoogleIdentity(tokens);
        if (!identity.email || !identity.emailVerified) {
            throw new AppError("Google account chưa verify email", 400);
        }

        const user = pending.linkUserId
            ? await this.linkGoogleToUser(pending.linkUserId, identity)
            : await this.findOrLinkUser(identity);

        return { ...issueTokenPair(user), mode };
    }

    static async unlinkGoogle(userId: string) {
        const identityRepo = AppDataSource.getRepository(AuthIdentity);
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOneBy({ id: userId });
        if (!user) throw new AppError("Không tìm thấy người dùng", 404);

        const identity = await identityRepo.findOneBy({
            userId,
            provider: "google",
        });
        if (!identity) throw new AppError("Chưa liên kết Google", 404);

        if (!user.passwordHash) {
            throw new AppError("Hãy đặt mật khẩu trước khi hủy liên kết Google", 400);
        }

        await identityRepo.remove(identity);
    }

    private static async exchangeCode(
        code: string,
        codeVerifier: string,
    ): Promise<GoogleTokenResponse> {
        const body = new URLSearchParams({
            code,
            client_id: googleConfig.clientId,
            client_secret: googleConfig.clientSecret,
            redirect_uri: googleConfig.redirectUri,
            grant_type: "authorization_code",
            code_verifier: codeVerifier,
        });

        const res = await fetch(GOOGLE_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body,
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("Google token exchange failed:", text);
            throw new AppError("Không đổi được code sang token Google", 400);
        }

        return (await res.json()) as GoogleTokenResponse;
    }

    private static async resolveGoogleIdentity(
        tokens: GoogleTokenResponse,
    ): Promise<GoogleIdentity> {
        const fromIdToken = await this.verifyIdToken(tokens.id_token);
        const fromUserInfo = await this.fetchUserInfo(tokens.access_token);

        return {
            sub: fromUserInfo.sub || fromIdToken.sub,
            email: (fromUserInfo.email || fromIdToken.email).toLowerCase(),
            emailVerified:
                fromUserInfo.emailVerified ?? fromIdToken.emailVerified,
            displayName: fromUserInfo.displayName || fromIdToken.displayName,
            givenName: fromUserInfo.givenName || fromIdToken.givenName,
            familyName: fromUserInfo.familyName || fromIdToken.familyName,
            avatarUrl: fromUserInfo.avatarUrl || fromIdToken.avatarUrl,
            locale: fromUserInfo.locale || fromIdToken.locale,
        };
    }

    private static async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
        const url = `${GOOGLE_TOKENINFO_URL}?id_token=${encodeURIComponent(idToken)}`;
        const res = await fetch(url);
        if (!res.ok) {
            throw new AppError("ID token Google không hợp lệ", 401);
        }

        const data = (await res.json()) as {
            sub?: string;
            email?: string;
            email_verified?: string | boolean;
            aud?: string;
            name?: string;
            given_name?: string;
            family_name?: string;
            picture?: string;
            locale?: string;
        };

        if (data.aud !== googleConfig.clientId) {
            throw new AppError("ID token không đúng client_id", 401);
        }
        if (!data.sub) {
            throw new AppError("ID token thiếu sub", 401);
        }

        return {
            sub: data.sub,
            email: (data.email || "").toLowerCase(),
            emailVerified: data.email_verified === true || data.email_verified === "true",
            displayName: data.name?.trim() || null,
            givenName: data.given_name?.trim() || null,
            familyName: data.family_name?.trim() || null,
            avatarUrl: data.picture?.trim() || null,
            locale: data.locale?.trim() || null,
        };
    }

    private static async fetchUserInfo(accessToken: string): Promise<GoogleIdentity> {
        const res = await fetch(GOOGLE_USERINFO_URL, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
            const text = await res.text();
            console.error("Google userinfo failed:", text);
            throw new AppError("Không lấy được hồ sơ Google", 400);
        }

        const data = (await res.json()) as {
            sub?: string;
            email?: string;
            email_verified?: boolean;
            name?: string;
            given_name?: string;
            family_name?: string;
            picture?: string;
            locale?: string;
        };

        if (!data.sub) {
            throw new AppError("Userinfo Google thiếu sub", 400);
        }

        return {
            sub: data.sub,
            email: (data.email || "").toLowerCase(),
            emailVerified: data.email_verified === true,
            displayName: data.name?.trim() || null,
            givenName: data.given_name?.trim() || null,
            familyName: data.family_name?.trim() || null,
            avatarUrl: data.picture?.trim() || null,
            locale: data.locale?.trim() || null,
        };
    }

    private static async linkGoogleToUser(
        userId: string,
        identity: GoogleIdentity,
    ): Promise<User> {
        const identityRepo = AppDataSource.getRepository(AuthIdentity);
        const userRepo = AppDataSource.getRepository(User);

        const user = await userRepo.findOneBy({ id: userId });
        if (!user) throw new AppError("Không tìm thấy người dùng", 404);

        const alreadyMine = await identityRepo.findOneBy({
            userId,
            provider: "google",
        });
        if (alreadyMine) {
            if (alreadyMine.providerSubject === identity.sub) {
                applyGoogleProfile(alreadyMine, identity);
                await identityRepo.save(alreadyMine);
                return user;
            }
            throw new AppError("Tài khoản đã liên kết Google khác", 409);
        }

        const usedByOther = await identityRepo.findOneBy({
            provider: "google",
            providerSubject: identity.sub,
        });
        if (usedByOther) {
            throw new AppError("Google này đã gắn với tài khoản khác", 409);
        }

        const created = identityRepo.create({
            userId: user.id,
            provider: "google",
            providerSubject: identity.sub,
        });
        applyGoogleProfile(created, identity);
        await identityRepo.save(created);
        return user;
    }

    private static async findOrLinkUser(identity: GoogleIdentity): Promise<User> {
        const identityRepo = AppDataSource.getRepository(AuthIdentity);
        const userRepo = AppDataSource.getRepository(User);

        const existingIdentity = await identityRepo.findOne({
            where: { provider: "google", providerSubject: identity.sub },
            relations: ["user"],
        });
        if (existingIdentity?.user) {
            applyGoogleProfile(existingIdentity, identity);
            await identityRepo.save(existingIdentity);
            return existingIdentity.user;
        }

        let user = await userRepo.findOneBy({ email: identity.email });
        if (!user) {
            user = await userRepo.save(
                userRepo.create({
                    email: identity.email,
                    passwordHash: null,
                    role: "user",
                }),
            );
        }

        const created = identityRepo.create({
            userId: user.id,
            provider: "google",
            providerSubject: identity.sub,
        });
        applyGoogleProfile(created, identity);
        await identityRepo.save(created);

        return user;
    }
}

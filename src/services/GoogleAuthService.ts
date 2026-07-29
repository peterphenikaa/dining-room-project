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

export type GoogleIdentity = {
    sub: string;
    email: string;
    emailVerified: boolean;
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

export class GoogleAuthService {
    static async buildAuthorizationUrl(): Promise<string> {
        assertGoogleOAuthConfigured();

        const state = randomUrlSafe(24);
        const { codeVerifier, codeChallenge } = createPkcePair();

        await saveGoogleOAuthPending(state, {
            codeVerifier,
            createdAt: Date.now(),
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

        const tokens = await this.exchangeCode(code, pending.codeVerifier);
        const identity = await this.verifyIdToken(tokens.id_token);
        if (!identity.email || !identity.emailVerified) {
            throw new AppError("Google account chưa verify email", 400);
        }

        const user = await this.findOrLinkUser(identity);
        return issueTokenPair(user);
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
            iss?: string;
        };

        if (data.aud !== googleConfig.clientId) {
            throw new AppError("ID token không đúng client_id", 401);
        }
        if (!data.sub) {
            throw new AppError("ID token thiếu sub", 401);
        }

        const emailVerified =
            data.email_verified === true || data.email_verified === "true";

        return {
            sub: data.sub,
            email: (data.email || "").toLowerCase(),
            emailVerified,
        };
    }

    private static async findOrLinkUser(identity: GoogleIdentity): Promise<User> {
        const identityRepo = AppDataSource.getRepository(AuthIdentity);
        const userRepo = AppDataSource.getRepository(User);

        const existingIdentity = await identityRepo.findOne({
            where: { provider: "google", providerSubject: identity.sub },
            relations: ["user"],
        });
        if (existingIdentity?.user) {
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

        await identityRepo.save(
            identityRepo.create({
                userId: user.id,
                provider: "google",
                providerSubject: identity.sub,
                email: identity.email,
            }),
        );

        return user;
    }
}

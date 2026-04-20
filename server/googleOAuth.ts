/**
 * Google OAuth 2.0 Authentication
 * Implements direct Google OAuth flow without Passport.js
 * Flow: /api/auth/google → Google → /api/auth/google/callback → session cookie → redirect
 */
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? "";
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function getRedirectUri(req: Request): string {
  // Use origin from state param if available, otherwise derive from request
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${proto}://${host}/api/auth/google/callback`;
}

export function registerGoogleOAuthRoutes(app: Express) {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    console.warn("[Google OAuth] GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET not set — Google login disabled");
    return;
  }

  // Step 1: Redirect to Google
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const returnPath = (req.query.returnPath as string) || "/";
    // Encode returnPath in state for post-login redirect
    const state = Buffer.from(JSON.stringify({ returnPath })).toString("base64url");

    const redirectUri = getRedirectUri(req);
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });

    res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  });

  // Step 2: Handle Google callback
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string;
    const stateRaw = req.query.state as string;
    const error = req.query.error as string;

    if (error) {
      console.error("[Google OAuth] Error from Google:", error);
      res.redirect("/?error=google_auth_failed");
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Missing authorization code" });
      return;
    }

    try {
      const redirectUri = getRedirectUri(req);

      // Exchange code for tokens
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const errBody = await tokenRes.text();
        console.error("[Google OAuth] Token exchange failed:", errBody);
        res.redirect("/?error=google_token_failed");
        return;
      }

      const tokens = await tokenRes.json() as { access_token: string; id_token?: string };

      // Fetch user info
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });

      if (!userInfoRes.ok) {
        console.error("[Google OAuth] Failed to fetch user info");
        res.redirect("/?error=google_userinfo_failed");
        return;
      }

      const userInfo = await userInfoRes.json() as {
        sub: string;
        email: string;
        name: string;
        picture?: string;
        email_verified?: boolean;
      };

      if (!userInfo.sub) {
        res.redirect("/?error=google_no_sub");
        return;
      }

      // Use Google sub as openId (prefixed to avoid collisions with Manus openIds)
      const openId = `google_${userInfo.sub}`;

      // Upsert user in DB
      await db.upsertUser({
        openId,
        name: userInfo.name || null,
        email: userInfo.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Create session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: userInfo.name || userInfo.email || "Google User",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Decode state for returnPath
      let returnPath = "/";
      try {
        if (stateRaw) {
          const decoded = JSON.parse(Buffer.from(stateRaw, "base64url").toString());
          returnPath = decoded.returnPath || "/";
        }
      } catch {
        // ignore
      }

      console.log(`[Google OAuth] User logged in: ${userInfo.email} (${openId})`);
      res.redirect(302, returnPath);
    } catch (err) {
      console.error("[Google OAuth] Callback error:", err);
      res.redirect("/?error=google_auth_error");
    }
  });

  console.log("[Google OAuth] Routes registered: /api/auth/google, /api/auth/google/callback");
}

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { storage } from "./storage";
import { db } from "./db";
import { regtechUsers } from "@shared/schema";
import { eq } from "drizzle-orm";

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, { id: user.id, isRegtechUser: user.isRegtechUser || false });
});

// Deserialize user from session
passport.deserializeUser(async (data: { id: string; isRegtechUser: boolean }, done) => {
  try {
    let user = await storage.getUser(data.id);
    if (!user) {
      const [regtechUser] = await db.select().from(regtechUsers).where(eq(regtechUsers.id, data.id)).limit(1);
      if (regtechUser) {
        user = regtechUser as any;
      }
    }
    done(null, user || null);
  } catch (error) {
    done(error, null);
  }
});

// Email/Password Strategy
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        let user = await storage.getUserByEmail(email);
        let isRegtechUser = false;

        if (!user) {
          const [regtechUser] = await db
            .select()
            .from(regtechUsers)
            .where(eq(regtechUsers.email, email))
            .limit(1);
          if (regtechUser) {
            user = regtechUser as any;
            isRegtechUser = true;
          }
        }

        if (!user || !user.password) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, { ...user, isRegtechUser });
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL ||
    `${process.env.APP_URL || "http://localhost:5000"}/api/auth/google/callback`;

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL,
        scope: ["profile", "email"],
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(null, false, { message: "No email provided by Google" });
          }

          // Check if user exists
          let user = await storage.getUserByEmail(email);

          if (!user) {
            // Check regtech users too
            const [regtechUser] = await db
              .select()
              .from(regtechUsers)
              .where(eq(regtechUsers.email, email))
              .limit(1);

            if (regtechUser) {
              return done(null, { ...regtechUser, isRegtechUser: true });
            }

            // Create new user from Google profile
            user = await storage.upsertUser({
              id: nanoid(),
              email,
              firstName: profile.name?.givenName || null,
              lastName: profile.name?.familyName || null,
              profileImageUrl: profile.photos?.[0]?.value || null,
              password: null, // OAuth users don't have passwords
            });
          } else {
            // Update profile image if not set
            if (!user.profileImageUrl && profile.photos?.[0]?.value) {
              user = await storage.updateUser(user.id, {
                profileImageUrl: profile.photos[0].value,
              });
            }
          }

          return done(null, { ...user, isRegtechUser: false });
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
  console.log("Google OAuth strategy configured");
} else {
  console.log("Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)");
}

// Microsoft OAuth using OpenID Connect
async function setupMicrosoftAuth() {
  if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_CLIENT_SECRET) {
    console.log("Microsoft OAuth not configured (missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET)");
    return;
  }

  try {
    const { Issuer, Strategy: OpenIDConnectStrategy } = await import("openid-client");

    const microsoftIssuer = await Issuer.discover(
      "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration"
    );

    const callbackURL =
      process.env.MICROSOFT_CALLBACK_URL ||
      `${process.env.APP_URL || "http://localhost:5000"}/api/auth/microsoft/callback`;

    const client = new microsoftIssuer.Client({
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      redirect_uris: [callbackURL],
      response_types: ["code"],
    });

    passport.use(
      "microsoft",
      new OpenIDConnectStrategy(
        {
          client,
          params: {
            scope: "openid profile email",
          },
        },
        async (tokenSet: any, userInfo: any, done: any) => {
          try {
            const email = userInfo.email || userInfo.preferred_username;
            if (!email) {
              return done(null, false, { message: "No email provided by Microsoft" });
            }

            let user = await storage.getUserByEmail(email);

            if (!user) {
              const [regtechUser] = await db
                .select()
                .from(regtechUsers)
                .where(eq(regtechUsers.email, email))
                .limit(1);

              if (regtechUser) {
                return done(null, { ...regtechUser, isRegtechUser: true });
              }

              user = await storage.upsertUser({
                id: nanoid(),
                email,
                firstName: userInfo.given_name || null,
                lastName: userInfo.family_name || null,
                profileImageUrl: null,
                password: null,
              });
            }

            return done(null, { ...user, isRegtechUser: false });
          } catch (error) {
            return done(error);
          }
        }
      )
    );
    console.log("Microsoft OAuth strategy configured");
  } catch (error) {
    console.error("Failed to configure Microsoft OAuth:", error);
  }
}

export { passport, setupMicrosoftAuth };

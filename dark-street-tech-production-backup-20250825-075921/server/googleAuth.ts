import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set");
}

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(profile: any) {
  // Beta invite check - only allow specific emails
  const BETA_INVITE_EMAILS = [
    'david.jairaj@gmail.com',
    'dj.darkbark@gmail.com',
    'test@darkstreet.tech',
    'test@example.com',
    'david@darkstreet.org',
    'barsha@darkstreet.org',
    'barshapanda.project@gmail.com',
  ];
  
  const email = profile.emails?.[0]?.value;
  if (!BETA_INVITE_EMAILS.includes(email?.toLowerCase())) {
    throw new Error('Beta access only. Please contact hello@darkstreet.org for an invitation.');
  }

  try {
    await storage.upsertUser({
      id: profile.id,
      email: email,
      firstName: profile.name?.givenName || '',
      lastName: profile.name?.familyName || '',
      profileImageUrl: profile.photos?.[0]?.value || null,
    });
    console.log(`User upserted successfully: ${email} (ID: ${profile.id})`);
  } catch (error) {
    console.error(`Error upserting user ${email}:`, error);
    throw error;
  }
}

export async function setupAuth(app: Express) {
  try {
    app.set("trust proxy", 1);
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Configure Google OAuth strategy - use darkstreet.tech for production
    const callbackURL = `https://darkstreet.tech/api/x9k2m/callback`;
    
    console.log("Google Auth Callback URL:", callbackURL);
    
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: callbackURL
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        await upsertUser(profile);
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          firstName: profile.name?.givenName,
          lastName: profile.name?.familyName,
          profileImageUrl: profile.photos?.[0]?.value,
          accessToken,
          refreshToken
        };
        return done(null, user);
      } catch (error) {
        console.error("Error in Google auth verification:", error);
        return done(error, false);
      }
    }));

    passport.serializeUser((user: any, done) => {
      done(null, user);
    });

    passport.deserializeUser((user: any, done) => {
      done(null, user);
    });

    // Auth routes with cryptic URLs
    app.get("/api/x9k2m/auth", passport.authenticate('google', {
      scope: ['profile', 'email']
    }));

    app.get("/api/x9k2m/callback", 
      passport.authenticate('google', { 
        failureRedirect: '/api/x9k2m/auth',
        failureMessage: true 
      }),
      (req, res) => {
        try {
          console.log(`Authentication successful for user: ${(req.user as any)?.email}`);
          // Successful authentication, redirect to app
          res.redirect('/');
        } catch (error) {
          console.error('Error in authentication callback:', error);
          res.redirect('/api/x9k2m/auth');
        }
      }
    );

    app.get("/api/x9k2m/logout", (req, res) => {
      req.logout((err) => {
        if (err) {
          console.error("Logout error:", err);
        }
        req.session.destroy((err) => {
          if (err) {
            console.error("Session destroy error:", err);
          }
          res.redirect('/');
        });
      });
    });

  } catch (error) {
    console.error("Error setting up Google authentication:", error);
    throw error;
  }
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
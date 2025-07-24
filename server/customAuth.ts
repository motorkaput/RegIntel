import type { Express, RequestHandler } from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { nanoid } from "nanoid";

// Custom authentication system without Replit branding
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET || 'darkstreet-tech-session-secret-key',
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

// Beta invite list - add emails here to allow access
const BETA_INVITE_EMAILS = [
  'david.jairaj@gmail.com',
  'dj.darkbark@gmail.com',
  'test@darkstreet.tech',
  'test@example.com',
  // Add more email addresses here as needed
];

export async function setupCustomAuth(app: Express) {
  app.use(getSession());

  // Beta invite-only authentication system
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, name } = req.body;
      
      if (!email || !email.includes('@')) {
        return res.status(400).json({ message: 'Valid email address required' });
      }

      // Check if email is on beta invite list
      if (!BETA_INVITE_EMAILS.includes(email.toLowerCase())) {
        return res.status(403).json({ 
          message: 'Beta access only. Please contact hello@darkstreet.org for an invitation.' 
        });
      }

      // Create or get user
      let user = await storage.getUserByEmail(email);
      if (!user) {
        user = await storage.upsertUser({
          id: nanoid(),
          email,
          firstName: name?.split(' ')[0] || '',
          lastName: name?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: null,
        });
      }

      // Set session
      (req as any).session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      res.json({ success: true, user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    (req as any).session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ success: true });
    });
  });

  app.get('/api/auth/user', (req, res) => {
    const user = (req as any).session?.user;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    res.json(user);
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const user = (req as any).session?.user;
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  (req as any).user = { claims: { sub: user.id } }; // Compatible with existing code
  next();
};
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");

function configurePassport() {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL =
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:5000/api/auth/google/callback";

  if (!clientID || !clientSecret) {
    return { enabled: false };
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase() || "";
          const name = profile.displayName || "Ramji Bakery Customer";
          const googleId = profile.id || "";

          if (!email) {
            return done(new Error("Google account has no email"));
          }

          const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);

          const user = await User.findOneAndUpdate(
            { email },
            {
              name,
              email,
              googleId,
              emailVerified: true,
              password: passwordHash
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
          );

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user?._id || user?.id || null);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user || null);
    } catch (error) {
      done(error);
    }
  });

  return { enabled: true };
}

module.exports = configurePassport;

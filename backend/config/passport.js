const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../schemas/User');

const hasGoogleAuth = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

if (hasGoogleAuth) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const primaryEmail = profile.emails?.[0]?.value;

          if (!primaryEmail) {
            return done(new Error('Google account did not return a valid email'), null);
          }

          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            if (!user.isActive) {
              return done(new Error('Your account has been deactivated'), null);
            }

            return done(null, user);
          }

          user = await User.findOne({ email: primaryEmail });

          if (user) {
            if (!user.isActive) {
              return done(new Error('Your account has been deactivated'), null);
            }

            user.googleId = profile.id;
            if (!user.avatar && profile.photos[0]) {
              user.avatar = profile.photos[0].value;
            }
            user.isEmailVerified = true;
            await user.save();
            return done(null, user);
          }

          user = await User.create({
            name: profile.displayName,
            email: primaryEmail,
            googleId: profile.id,
            avatar: profile.photos[0] ? profile.photos[0].value : null,
            isEmailVerified: true,
            role: 'user',
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

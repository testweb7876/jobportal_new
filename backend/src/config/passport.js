const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const OAuth2Strategy = require('passport-oauth2');
const axios = require('axios');
const User = require('../models/User.model');

const API_URL = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

// ─── GOOGLE ───────────────────────────────────────────────────────────────
passport.use('google', new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${API_URL}${API_PREFIX}/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(null, false, { message: 'Google account has no email.' });

      let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] });

      if (user) {
        if (!user.googleId) {
          user.googleId = profile.id;
          if (!user.socialMedia) user.socialMedia = 'google';
          if (user.status === 'pending') user.status = 'active';
          user.isEmailVerified = true;
          await user.save({ validateBeforeSave: false });
        }
      } else {
        user = await User.create({
          firstName: profile.name?.givenName || profile.displayName || 'User',
          lastName: profile.name?.familyName || '',
          email,
          googleId: profile.id,
          socialMedia: 'google',
          status: 'active',
          isEmailVerified: true,
          role: 'jobseeker',
          avatar: profile.photos?.[0]?.value
            ? { secureUrl: profile.photos[0].value, resourceType: 'image' }
            : undefined,
        });
      }

      if (user.status === 'suspended' || user.status === 'banned') {
        return done(null, false, { message: `Your account has been ${user.status}.` });
      }

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));

// ─── LINKEDIN (OpenID Connect — LinkedIn's current OAuth flow) ────────────
const linkedinVerify = async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.email;
    if (!email) return done(null, false, { message: 'LinkedIn account has no email.' });

    let user = await User.findOne({ $or: [{ linkedinId: profile.sub }, { email }] });

    if (user) {
      if (!user.linkedinId) {
        user.linkedinId = profile.sub;
        if (!user.socialMedia) user.socialMedia = 'linkedin';
        if (user.status === 'pending') user.status = 'active';
        user.isEmailVerified = true;
        await user.save({ validateBeforeSave: false });
      }
    } else {
      user = await User.create({
        firstName: profile.given_name || 'User',
        lastName: profile.family_name || '',
        email,
        linkedinId: profile.sub,
        socialMedia: 'linkedin',
        status: 'active',
        isEmailVerified: true,
        role: 'jobseeker',
        avatar: profile.picture
          ? { secureUrl: profile.picture, resourceType: 'image' }
          : undefined,
      });
    }

    if (user.status === 'suspended' || user.status === 'banned') {
      return done(null, false, { message: `Your account has been ${user.status}.` });
    }

    done(null, user);
  } catch (err) {
    done(err, null);
  }
};

const linkedinStrategy = new OAuth2Strategy(
  {
    authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
    clientID: process.env.LINKEDIN_CLIENT_ID,
    clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    callbackURL: `${API_URL}${API_PREFIX}/auth/linkedin/callback`,
    scope: ['openid', 'profile', 'email'],
    state: true,
  },
  linkedinVerify
);

linkedinStrategy.userProfile = async function (accessToken, done) {
  try {
    const { data } = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    done(null, data); // { sub, email, given_name, family_name, picture, ... }
  } catch (err) {
    done(err);
  }
};

passport.use('linkedin', linkedinStrategy);

module.exports = passport;
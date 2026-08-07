import jwt from 'jsonwebtoken';

/**
 * Sign a JWT access token for the given user ID.
 * Reads JWT_SECRET and JWT_EXPIRES_IN from process.env.
 */
export const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

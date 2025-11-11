import jwt, * as jsonwebtoken from 'jsonwebtoken';

export class JwtUtils {
  private static secret: string = process.env.JWT_ACCESS_SECRET || '';
  private static expiresIn: string = process.env.JWT_EXPIRES_IN || '1h';

  // Generate JWT token
  static generateToken(payload: object): string {
    const options: jsonwebtoken.SignOptions = { expiresIn: this.expiresIn };
    return jwt.sign(payload, secret, options);
  }

  // Verify JWT token, return payload or null
  verifyToken<T = jsonwebtoken.JwtPayload>(token: string): T | null {
    try {
      return jwt.verify(token, secret) as T;
    } catch (err) {
      return null;
    }
  }

  // Decode JWT token without verifying, return payload or null
  decodeToken<T = jsonwebtoken.JwtPayload>(token: string): T | null {
    try {
      return jwt.decode(token) as T | null;
    } catch (err) {
      return null;
    }
  }
}

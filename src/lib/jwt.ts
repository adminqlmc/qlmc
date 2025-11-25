import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'fallback-secret';

export function signJwtToken(payload: object, expiresIn: string | number = '1d') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn });
}

export function verifyJwtToken(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch {
    return null;
  }
}

export interface JwtPayload {
  userId: string;
  userID: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'technician';
}

export async function getJwtPayload(token: string): Promise<JwtPayload | null> {
  const payload = verifyJwtToken(token);
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  return payload as JwtPayload;
}

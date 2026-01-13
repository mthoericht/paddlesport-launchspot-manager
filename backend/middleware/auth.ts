import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'paddlesport-secret-key-2024';

/**
 * Express request with authenticated user information
 */
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
    is_admin: boolean;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => 
{
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) 
  {
    return res.status(401).json({ error: 'Zugang verweigert. Kein Token vorhanden.' });
  }

  try 
  {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
  }
  catch (error) 
  {
    return res.status(403).json({ error: 'Ungültiger Token.' });
  }
};

export { JWT_SECRET };


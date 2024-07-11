import { config } from '@gateway/config';
import { BadRequestError, IAuthPayload, NotAuthorizedError } from '@greatdaveo/jobint-shared';
import { NextFunction, Request, Response } from 'express';

import { verify } from 'jsonwebtoken';

class AuthMiddleware {
  // To check if the check if the request from the frontend has a valid JWT Token
  public verifyUser(req: Request, _res: Response, next: NextFunction): void {
    if (!req.session?.jwt) {
      throw new NotAuthorizedError('Token is not available. Please login again.', 'GatewayService verifyUser() method error');
    }

    try {
      const payload: IAuthPayload = verify(req.session?.jwt, `${config.JWT_TOKEN}`) as IAuthPayload;
      req.currentUser = payload;
    } catch (error) {
      throw new NotAuthorizedError(
        'Token is not available. Please login again.',
        'GatewayService verifyUser() method invalid session error'
      );
    }

    next();
  }

  //   To check the user authentication
  public checkAuthentication(req: Request, _res: Response, next: NextFunction): void {
    if (!req.currentUser) {
      throw new BadRequestError(
        'Authentication is required to access this route.',
        'GatewayService checkAuthentication() method invalid session error'
      );
    }

    next();
  }
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();

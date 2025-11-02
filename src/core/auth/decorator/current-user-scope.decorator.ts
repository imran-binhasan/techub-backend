import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserScope } from '../guard/scope-permission.guard';

/**
 * Extract user scope from request
 * Use this in controllers/services to determine what data the user can access
 * 
 * @example
 * async getAttendance(@CurrentUserScope() userScope: UserScope) {
 *   if (userScope.hasAllAccess) {
 *     // Return all attendance records
 *   } else if (userScope.hasOwnAccess) {
 *     // Return only user's own records
 *   }
 * }
 */
export const CurrentUserScope = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserScope => {
    const request = ctx.switchToHttp().getRequest();
    return request.userScope;
  },
);

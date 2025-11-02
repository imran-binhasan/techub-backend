# Scope-Based Permission System

## Overview

Our authentication system now uses a **scope-based RBAC (Role-Based Access Control)** that provides fine-grained access control through database-driven permissions.

## Permission Structure

Each permission has:
- **resource**: What you're accessing (e.g., 'attendance', 'product', 'order')
- **action**: What you're doing (e.g., 'read', 'create', 'update', 'delete')
- **scope**: The reach of the permission:
  - **`all`**: Access everything (Admin/Manager level)
  - **`department`**: Access department-level data (Supervisor level)
  - **`assigned`**: Access assigned items only
  - **`own`**: Access only your own data (Worker level)

## Using Decorators

### Basic Permission Decorators

```typescript
import { RequireOwn, RequireAll, RequireOwnOrAll } from 'src/core/auth/decorator/permission.decorator';
import { CurrentUser } from 'src/core/auth/decorator/current-user.decorator';
import { CurrentUserScope } from 'src/core/auth/decorator/current-user-scope.decorator';
import { UserScope } from 'src/core/auth/guard/scope-permission.guard';

// 1. Require 'own' scope only - workers can only see their own data
@Get('my-attendance')
@UseGuards(JwtAuthGuard, ScopePermissionGuard)
@RequireOwn('read', 'attendance')
async getMyAttendance(@CurrentUser() user: any) {
  return this.attendanceService.getMyAttendance(user.id);
}

// 2. Require 'all' scope only - admin/managers only
@Post('manual')
@UseGuards(JwtAuthGuard, ScopePermissionGuard)
@RequireAll('create', 'attendance')
async createAttendance(@Body() dto: CreateAttendanceDto) {
  return this.attendanceService.create(dto);
}

// 3. Require either 'own' or 'all' - most flexible
@Get()
@UseGuards(JwtAuthGuard, ScopePermissionGuard)
@RequireOwnOrAll('read', 'attendance')
async getAttendance(
  @CurrentUser() user: any,
  @CurrentUserScope() userScope: UserScope,
  @Query() query: QueryDto
) {
  if (userScope.hasAllAccess) {
    // Admin/Manager: return all records
    return this.attendanceService.findAll(query);
  } else {
    // Worker: return only their records
    return this.attendanceService.findByUserId(user.id, query);
  }
}
```

### Advanced Decorators

```typescript
// Department-level access (supervisors)
@RequireDepartmentOrAll('read', 'attendance')

// Assigned items (task assignment, etc.)
@RequireAssignedOrAll('update', 'task')

// Custom scopes
@RequireScopes('read', 'report', ['own', 'department', 'all'])

// Any scope (most permissive)
@RequireAnyScope('read', 'user')
```

## Using UserScope in Services

The `UserScope` object is automatically attached to the request and contains:

```typescript
export interface UserScope {
  hasAllAccess: boolean;        // Can access everything
  hasOwnAccess: boolean;         // Can access own data
  hasDepartmentAccess: boolean;  // Can access department data
  hasAssignedAccess: boolean;    // Can access assigned items
  maxScope: 'all' | 'department' | 'assigned' | 'own' | null;
  allowedScopes: string[];       // All allowed scopes
  permissions: Permission[];      // Full permission objects
}
```

### Example Service Implementation

```typescript
async findAll(
  queryDto: QueryDto,
  currentUser: any,
  userScope: UserScope
) {
  const queryBuilder = this.repository.createQueryBuilder('attendance');

  // Apply scope-based filtering
  if (userScope.hasAllAccess) {
    // No filtering - return all
  } else if (userScope.hasDepartmentAccess) {
    // Filter by department
    queryBuilder.andWhere('attendance.departmentId = :deptId', {
      deptId: currentUser.departmentId
    });
  } else if (userScope.hasOwnAccess) {
    // Filter by user
    queryBuilder.andWhere('attendance.userId = :userId', {
      userId: currentUser.id
    });
  } else {
    throw new ForbiddenException('Insufficient permissions');
  }

  return queryBuilder.getMany();
}
```

## Complete Controller Example

```typescript
@Controller('attendance')
@UseGuards(JwtAuthGuard, ScopePermissionGuard)
export class AttendanceController {
  
  // Public endpoint - no auth required
  @Public()
  @Post('check-in')
  async checkIn(@Body() dto: CheckInDto) {
    return this.service.checkIn(dto);
  }

  // Admin/Manager only
  @RequireAll('create', 'attendance')
  @Post('manual')
  async createManual(@Body() dto: CreateDto) {
    return this.service.createManual(dto);
  }

  // Own or All scope
  @RequireOwnOrAll('read', 'attendance')
  @Get()
  async findAll(
    @CurrentUser() user: any,
    @CurrentUserScope() scope: UserScope,
    @Query() query: QueryDto
  ) {
    return this.service.findAll(query, user, scope);
  }

  // Department or All scope
  @RequireDepartmentOrAll('update', 'attendance')
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateDto,
    @CurrentUserScope() scope: UserScope
  ) {
    // Validate scope before updating
    const record = await this.service.findOne(id);
    if (!scope.hasAllAccess && record.departmentId !== user.departmentId) {
      throw new ForbiddenException('Cannot update outside your department');
    }
    return this.service.update(id, dto);
  }
}
```

## Database Setup

### Seed Permissions

```sql
-- Admin permissions
INSERT INTO permission (resource, action, scope, display_name) VALUES
('attendance', 'create', 'all', 'Create Any Attendance'),
('attendance', 'read', 'all', 'View All Attendance'),
('attendance', 'update', 'all', 'Update Any Attendance'),
('attendance', 'delete', 'all', 'Delete Any Attendance');

-- Supervisor permissions
INSERT INTO permission (resource, action, scope, display_name) VALUES
('attendance', 'read', 'department', 'View Department Attendance'),
('attendance', 'update', 'department', 'Update Department Attendance');

-- Worker permissions
INSERT INTO permission (resource, action, scope, display_name) VALUES
('attendance', 'read', 'own', 'View Own Attendance'),
('attendance', 'create', 'own', 'Create Own Attendance');
```

### Assign to Roles

```sql
-- Admin role gets all-scope permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permission WHERE scope = 'all' AND resource = 'attendance';

-- Supervisor role gets department-scope
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permission WHERE scope IN ('department', 'own') AND resource = 'attendance';

-- Worker role gets own-scope only
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permission WHERE scope = 'own' AND resource = 'attendance';
```

## Benefits

✅ **Flexible**: Easy to add new resources and actions
✅ **Scalable**: Database-driven, no code changes for permission updates
✅ **Performant**: Permissions cached in Redis
✅ **Type-safe**: Full TypeScript support
✅ **Fine-grained**: Control access at scope level (own/department/all)
✅ **Auditable**: All permissions tracked in database

## Migration from Old System

Old:
```typescript
@AdminOnly()
@RequirePermissions('create:product', 'update:product')
```

New:
```typescript
@UseGuards(JwtAuthGuard, ScopePermissionGuard)
@RequireAll('create', 'product')  // Only admins with all-scope can create
```

## Production Checklist

- [ ] Create all necessary permissions in database
- [ ] Assign permissions to roles
- [ ] Test permission caching (verify Redis)
- [ ] Test scope filtering in services
- [ ] Update all controllers to use new decorators
- [ ] Remove old permission guards
- [ ] Document custom permissions for your domain
- [ ] Set up permission management UI for admins

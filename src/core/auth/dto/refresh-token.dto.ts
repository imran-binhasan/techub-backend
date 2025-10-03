import { IsIn, IsString } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  userId: string;

  @IsIn(['admin', 'customer'])
  userType: 'admin' | 'customer';
}

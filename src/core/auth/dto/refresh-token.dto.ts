import { IsIn, IsNumber } from 'class-validator';

export class RefreshTokenDto {
  @IsNumber()
  userId: number;

  @IsIn(['admin', 'customer'])
  userType: 'admin' | 'customer';
}

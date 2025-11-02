export class CustomerProfileDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  image?: string;
  dateOfBirth?: Date;
  gender?: string;
  preferredLanguage?: string;
  tier: string;
  rewardPoints: number;
  totalOrders: number;
  totalSpent: number;
  createdAt: Date;
}

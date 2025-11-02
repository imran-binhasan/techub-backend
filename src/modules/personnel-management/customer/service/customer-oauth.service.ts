import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Customer } from '../entity/customer.entity';
import { User, UserType } from '../../user/entity/user.entity';
import { TokenService } from 'src/core/auth/service/token-service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CustomerOAuthService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource,
    private tokenService: TokenService,
    private configService: ConfigService,
  ) {}

  /**
   * Authenticate with Google ID Token
   */
  async googleAuth(idToken: string) {
    // Verify Google ID token
    const googleUser = await this.verifyGoogleToken(idToken);

    return this.findOrCreateSocialUser(
      googleUser.email,
      googleUser.given_name || googleUser.name,
      googleUser.family_name || '',
      googleUser.picture,
      'google',
    );
  }

  /**
   * Authenticate with Facebook Access Token
   */
  async facebookAuth(accessToken: string) {
    // Verify Facebook token
    const facebookUser = await this.verifyFacebookToken(accessToken);

    return this.findOrCreateSocialUser(
      facebookUser.email,
      facebookUser.first_name,
      facebookUser.last_name,
      facebookUser.picture?.data?.url,
      'facebook',
    );
  }

  /**
   * Find existing user or create new one from social login
   */
  private async findOrCreateSocialUser(
    email: string,
    firstName: string,
    lastName: string,
    picture: string | undefined,
    provider: 'google' | 'facebook',
  ) {
    return await this.dataSource.transaction(async (manager) => {
      // Check if user exists
      let user = await manager.findOne(User, {
        where: { email: email.toLowerCase() },
        relations: ['customer'],
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        isNewUser = true;
        user = manager.create(User, {
          email: email.toLowerCase(),
          firstName,
          lastName,
          image: picture,
          userType: UserType.CUSTOMER,
          emailVerified: true, // Social logins are pre-verified
          password: '', // No password for OAuth users
        });
        await manager.save(user);

        // Create customer profile
        const customer = manager.create(Customer, {
          userId: user.id,
          tier: 'bronze',
          preferredLanguage: 'en',
        });
        await manager.save(customer);
        user.customer = customer;
      } else if (!user.customer) {
        // User exists but no customer profile
        const customer = manager.create(Customer, {
          userId: user.id,
          tier: 'bronze',
          preferredLanguage: 'en',
        });
        await manager.save(customer);
        user.customer = customer;
      }

      // Generate tokens
      const tokens = this.tokenService.generateTokenPair({
        sub: user.id.toString(),
        email: user.email!,
        type: 'customer',
      });

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenType: 'Bearer' as const,
        expiresIn: tokens.expires_in,
        user: {
          id: user.customer.id,
          email: user.email!,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          provider,
          isNewUser,
        },
        userType: 'customer' as const,
      };
    });
  }

  /**
   * Verify Google ID Token
   */
  private async verifyGoogleToken(idToken: string) {
    try {
      const response = await axios.get(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );

      const data = response.data;

      // Verify token is for your app
      const clientId = this.configService.get('GOOGLE_CLIENT_ID');
      if (data.aud !== clientId) {
        throw new UnauthorizedException('Invalid Google token');
      }

      return data;
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  /**
   * Verify Facebook Access Token
   */
  private async verifyFacebookToken(accessToken: string) {
    try {
      const appId = this.configService.get('FACEBOOK_APP_ID');
      const appSecret = this.configService.get('FACEBOOK_APP_SECRET');

      // Verify token
      const verifyResponse = await axios.get(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`,
      );

      if (!verifyResponse.data.data.is_valid) {
        throw new UnauthorizedException('Invalid Facebook token');
      }

      // Get user data
      const userResponse = await axios.get(
        `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`,
      );

      if (!userResponse.data.email) {
        throw new BadRequestException('Email permission required');
      }

      return userResponse.data;
    } catch (error) {
      throw new UnauthorizedException('Invalid Facebook token');
    }
  }
}

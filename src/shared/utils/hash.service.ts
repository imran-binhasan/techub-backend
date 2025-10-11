import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class HashService {
  /**
   * Hash a plain text password using Argon2
   */
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id, // Most secure variant
      memoryCost: 65536, // 64 MiB
      timeCost: 3, // Number of iterations
      parallelism: 4, // Number of threads
    });
  }

  /**
   * Verify a plain text password against a hash
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch (error) {
      // If verification fails due to invalid hash format
      return false;
    }
  }

  /**
   * Check if password needs rehashing (if argon2 parameters changed)
   */
  async needsRehash(hash: string): Promise<boolean> {
    try {
      return argon2.needsRehash(hash, {
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    } catch (error) {
      return true; // Rehash if we can't determine
    }
  }
}
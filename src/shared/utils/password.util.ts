import * as argon2 from 'argon2';

export class PasswordUtil {
  static async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  static async needsRehash(hash: string): Promise<boolean> {
    try {
      return argon2.needsRehash(hash, {
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
      });
    } catch {
      return true;
    }
  }

  static validateStrength(password: string): {
    isValid: boolean;
    message?: string;
  } {
    if (!password || password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters',
      };
    }

    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!hasLower || !hasNumber) {
      return {
        isValid: false,
        message: 'Password must contain lowercase letters and numbers',
      };
    }

    return { isValid: true };
  }

  static getStrengthScore(password: string): number {
    if (!password) return 0;

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    return Math.min(score, 4);
  }
}

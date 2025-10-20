import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';

@Injectable()
export class UserService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async register(email: string, password: string) {
    const { data, error } = await this.supabaseService.getClient().auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new Error(`Error registering user: ${error.message}`);
    }

    const isVerified = data.user?.email_confirmed_at ? true : false;
    return { ...data, isVerified };
  }

  async createProfile(userId: string, name: string, email: string) {
    return await this.supabaseService.getClient()
      .from('users')
      .insert([
        {
          id: userId,
          name,
          email,
        },
      ])
      .select();
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Error logging in: ${error.message}`);
    }

    return data;
  }

  async isEmailVerified(userId: string) {
    const { data, error } = await this.supabaseService.getClient().auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }

    return !!data.user?.email_confirmed_at;
  }
}

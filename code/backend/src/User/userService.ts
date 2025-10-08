import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';

@Injectable()
export class UserService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async signUp(email: string, password: string) {
    return await this.supabaseService.getClient().auth.signUp({
      email,
      password,
    });
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
}

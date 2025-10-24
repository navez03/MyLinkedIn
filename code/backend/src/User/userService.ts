import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';

@Injectable()
export class UserService {
  constructor(private readonly supabaseService: SupabaseService) { }

  async register(email: string, password: string) {
    const { data: usersData, error: usersError } = await this.supabaseService.getClient().auth.admin.listUsers();

    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }

    const userExists = usersData?.users?.some((user: any) => user.email === email);
    if (userExists) {
      throw new Error(`Account already exists with this email`);
    }

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

  async getUserProfile(userId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('id, name, email')
      .eq('id', userId);

    if (error) {
      throw new Error(`Error fetching user profile: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }

    return data[0];
  }


  async getAllUsers(currentUserId: string) {
    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('id, name, email')
      .neq('id', currentUserId);

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    return data || [];
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query || query.trim() === '') {
      return [];
    }

    const searchTerm = `${query.trim()}%`;

    const { data, error } = await this.supabaseService.getClient()
      .from('users')
      .select('id, name, email')
      .neq('id', currentUserId)
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);

    if (error) {
      throw new Error(`Error searching users: ${error.message}`);
    }

    return data || [];
  }
}

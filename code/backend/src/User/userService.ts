import { Injectable, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SessionService } from './sessionService';


@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly sessionService: SessionService
  ) { }

  async logout(token: string) {
    try {
      if (!token) {
        throw new BadRequestException('Token is required for logout');
      }
      return await this.sessionService.revokeSession(token);
    } catch (error) {
      this.logger.error('Logout error', error.message);
      throw error;
    }
  }

  async register(email: string, password: string) {
    try {
      if (!this.isValidEmail(email)) {
        throw new BadRequestException('Invalid email format');
      }

      if (!this.isStrongPassword(password)) {
        throw new BadRequestException(
          'Password must be at least 8 characters and contain uppercase, lowercase, number and special character'
        );
      }

      const { data: usersData, error: usersError } = await this.supabaseService.getClient().auth.admin.listUsers();

      if (usersError) {
        this.logger.error('Error fetching users', usersError.message);
        throw new BadRequestException('Error checking user existence');
      }

      const userExists = usersData?.users?.some((user: any) => user.email?.toLowerCase() === email.toLowerCase().trim());
      if (userExists) {
        throw new BadRequestException('Account already exists with this email');
      }

      const { data, error } = await this.supabaseService.getClient().auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            name: null,
            avatar_url: null
          },
        },
      });

      if (error) {
        this.logger.error('Registration error', error.message);
        throw new BadRequestException(`Error registering user: ${error.message}`);
      }

      this.logger.log(`User registered successfully: ${email}`);
      const isVerified = data.user?.email_confirmed_at ? true : false;
      return { ...data, isVerified };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Unexpected registration error', error);
      throw new BadRequestException('Registration failed');
    }
  }

  async createProfile(userId: string, name: string, email: string) {
    return await this.supabaseService.getClient()
      .from('users')
      .insert([
        {
          id: userId,
          name,
          email,
          avatar_url: null
        },
      ])
      .select();
  }

  async login(email: string, password: string) {
    try {
      if (!email || !password) {
        throw new UnauthorizedException('Email and password are required');
      }

      const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        this.logger.error('Login error', error.message);
        throw new UnauthorizedException('Invalid credentials');
      }

      this.logger.log(`Successful login for user: ${data.user.id}`);
      return data;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Unexpected login error', error);
      throw new UnauthorizedException('Login failed');
    }
  }

  async isEmailVerified(userId: string) {
    const { data, error } = await this.supabaseService.getClient().auth.admin.getUserById(userId);

    if (error) {
      throw new Error(`Error fetching user: ${error.message}`);
    }

    return !!data.user?.email_confirmed_at;
  }

  async getUserProfile(token: string) {
    try {
      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      const user = await this.getUserFromToken(token);
      const userClient = this.supabaseService.getClientWithToken(token);

      const { data, error } = await userClient
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        this.logger.warn(`Failed to fetch profile for user ${user.id}`, error.message);
      }

      if (!data) {
        const fallbackProfile = {
          id: user.id,
          name: user.email?.split('@')[0] || 'Unknown User',
          email: user.email || '',
          avatar_url: user.user_metadata?.avatar_url || null,
        };

        this.logger.log(`Profile retrieved for user: ${user.id}`);
        return fallbackProfile;
      }

      this.logger.log(`Profile retrieved for user: ${user.id}`);
      return data;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error fetching user profile', error);
      throw new BadRequestException('Unable to fetch user profile');
    }
  }

  async getUserProfileById(userId: string, token: string) {
    try {
      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      await this.getUserFromToken(token);
      const userClient = this.supabaseService.getClientWithToken(token);

      const { data, error } = await userClient
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        this.logger.warn(`Failed to fetch profile for user ${userId}`, error.message);
        throw new BadRequestException(`Unable to fetch user profile: ${error.message}`);
      }

      if (!data) {
        throw new BadRequestException('User not found');
      }

      this.logger.log(`Profile retrieved for user: ${userId}`);
      return data;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error fetching user profile by ID', error);
      throw new BadRequestException('Unable to fetch user profile');
    }
  }

  async getAllUsers(token: string) {
    try {
      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      const user = await this.getUserFromToken(token);
      const userClient = this.supabaseService.getClientWithToken(token);

      this.logger.log(`Getting all users except: ${user.id}`);

      const { data, error } = await userClient
        .from('users')
        .select('id, name, email, avatar_url')
        .neq('id', user.id);

      if (error) {
        this.logger.error('Error fetching all users:', error);
        throw new BadRequestException(`Error fetching users: ${error.message}`);
      }

      this.logger.log(`All users found: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Unexpected error fetching users', error);
      throw new BadRequestException('Unable to fetch users');
    }
  }

  async searchUsers(query: string, token: string) {
    try {
      if (!token) {
        throw new UnauthorizedException('Access token is required');
      }

      if (!query || query.trim() === '') {
        return [];
      }

      const user = await this.getUserFromToken(token);
      const userClient = this.supabaseService.getClientWithToken(token);
      const searchTerm = `${query.trim()}%`;

      const { data, error } = await userClient
        .from('users')
        .select('id, name, email, avatar_url')
        .neq('id', user.id)
        .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`);

      if (error) {
        this.logger.error('Error searching users in database:', error);
        throw new BadRequestException(`Error searching users: ${error.message}`);
      }

      this.logger.log(`Search results from database: ${data?.length || 0}`);
      return data || [];
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Unexpected error searching users', error);
      throw new BadRequestException('Unable to search users');
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File, token: string): Promise<string> {
    try {
      if (!userId || !file) {
        throw new BadRequestException('User ID and file are required');
      }

      // Gerar nome único para o arquivo
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExtension}`;
      const filePath = `avatars/${fileName}`;

      const supabaseClient = this.supabaseService.getClient();
      const { data: uploadData, error: uploadError } = await supabaseClient
        .storage
        .from('avatars')
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        this.logger.error('Error uploading to storage:', uploadError);
        throw new BadRequestException(`Error uploading avatar: ${uploadError.message}`);
      }

      const { data: urlData } = supabaseClient
        .storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new BadRequestException('Failed to get public URL for avatar');
      }

      this.logger.log(`Avatar uploaded successfully for user: ${userId}`);
      return urlData.publicUrl;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Unexpected error uploading avatar', error);
      throw new BadRequestException('Unable to upload avatar');
    }
  }

  async updateUserProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      // Validate that at least one field is being updated
      if (!updateProfileDto.name && !updateProfileDto.avatar_url) {
        throw new BadRequestException('At least one field (name or avatar_url) must be provided for update');
      }

      // Get user info from auth to have email
      const userClient = this.supabaseService.getClient();
      const { data: authUser } = await userClient.auth.admin.getUserById(userId);

      if (!authUser?.user) {
        throw new BadRequestException('User not found in auth');
      }

      // Check if user exists first
      const { data: existingUser } = await userClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let data, error;

      if (existingUser) {
        // User exists - update only the fields provided
        const updateData: any = {};

        if (updateProfileDto.name) {
          updateData.name = updateProfileDto.name.trim();
        }

        if (updateProfileDto.avatar_url !== undefined) {
          updateData.avatar_url = updateProfileDto.avatar_url;
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
          // Nothing to update, return existing user
          data = existingUser;
          error = null;
        } else {
          const result = await userClient
            .from('users')
            .update(updateData)
            .eq('id', userId)
            .select()
            .maybeSingle();

          data = result.data;
          error = result.error;
        }
      } else {
        // User doesn't exist - insert new record
        const insertData: any = {
          id: userId,
          email: authUser.user.email,
          name: updateProfileDto.name?.trim() || authUser.user.email?.split('@')[0] || 'User',
          avatar_url: updateProfileDto.avatar_url || null,
        };

        const result = await userClient
          .from('users')
          .insert(insertData)
          .select()
          .maybeSingle();

        data = result.data;
        error = result.error;
      }

      if (error) {
        this.logger.error(`Error upserting profile for user ${userId}:`, error);
        throw new BadRequestException(`Error updating profile: ${error.message}`);
      }

      if (!data) {
        throw new BadRequestException('Failed to update profile');
      }

      if (updateProfileDto.name) {
        try {
          const { error: authError } = await this.supabaseService.getClient().auth.admin.updateUserById(
            userId,
            {
              user_metadata: {
                name: updateProfileDto.name.trim()
              }
            }
          );

          if (authError) {
            this.logger.warn(`Failed to update auth metadata for user ${userId}:`, authError.message);
          }
        } catch (authError) {
          this.logger.warn(`Failed to update auth metadata:`, authError);
        }
      }

      this.logger.log(`Profile updated successfully for user: ${userId}`);
      return data;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Unexpected error updating user profile', error);
      throw new BadRequestException('Unable to update user profile');
    }
  }

  async getUserFromToken(token: string) {
    try {
      const { data: { user }, error } = await this.supabaseService.getClient().auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid or expired token');
      }

      if (user.aud !== 'authenticated') {
        throw new UnauthorizedException('User is not authenticated');
      }

      return user;
    } catch (error) {
      this.logger.warn('Token validation failed', error.message);
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  private isStrongPassword(password: string): boolean {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return strongRegex.test(password);
  }
}

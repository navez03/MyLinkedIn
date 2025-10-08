import { Controller, Post, Body, ValidationPipe, HttpStatus, HttpException } from '@nestjs/common';
import { SupabaseService } from '../config/supabaseClient';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly supabaseService: SupabaseService) { }

  @Post('register')
  async register(@Body(ValidationPipe) registerUserDto: RegisterUserDto): Promise<RegisterResponseDto> {
    const { email, password, name } = registerUserDto;

    try {
      const { data: authData, error: authError } = await this.supabaseService.signUp(
        email,
        password,
      );

      if (authError) {
        throw new HttpException(
          {
            success: false,
            message: 'Error creating account',
            error: authError.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!authData.user) {
        throw new HttpException(
          {
            success: false,
            message: 'Internal Error: User data is null',
            error: 'User data is null',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      const { data: profileData, error: profileError } = await this.supabaseService.createProfile(
        authData.user.id,
        name,
        email,
      );

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw new HttpException(
          {
            success: false,
            message: 'Account created but error saving profile',
            error: profileError.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return {
        success: true,
        message: 'Account created successfully! Please check your email to confirm your account.',
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          name: name,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Unexpected error:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Internal server error',
          error: 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
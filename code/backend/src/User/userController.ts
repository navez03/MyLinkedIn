
import { Controller, Post, Body, ValidationPipe, HttpStatus, HttpException } from '@nestjs/common';
import { UserService } from './userService';
import { RegisterUserDto } from './dto/register-user.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CheckEmailVerifiedDto } from './dto/check-email-verified.dto';
import { CheckEmailVerifiedResponseDto } from './dto/check-email-verified-response.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  async register(@Body(ValidationPipe) registerUserDto: RegisterUserDto): Promise<RegisterResponseDto> {
    try {
      const result = await this.userService.register(
        registerUserDto.email,
        registerUserDto.password,
      );

      if (!result.user) {
        throw new HttpException(
          {
            success: false,
            message: 'Internal Error: User data is null',
            error: 'User data is null',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Não criar o perfil aqui - será criado após a verificação do email e nome

      return {
        success: true,
        message: 'Account created successfully! Please check your email to confirm your account.',
        user: {
          id: result.user.id,
          email: result.user.email!,
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
          message: 'Error creating account',
          error: error.message || 'Internal server error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async handleCreateProfile(userId: string, name: string, email: string): Promise<void> {
    const result = await this.userService.createProfile(userId, name, email);
    if (result.error) {
      console.error('Error creating profile:', result.error);
      throw new HttpException(
        {
          success: false,
          message: 'Account created but error saving profile',
          error: result.error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-profile')
  async createProfile(
    @Body(ValidationPipe) createProfileDto: CreateProfileDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.handleCreateProfile(createProfileDto.userId, createProfileDto.name, createProfileDto.email);
      return {
        success: true,
        message: 'Profile created successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('Unexpected error:', error);
      throw new HttpException(
        {
          success: false,
          message: 'Error creating profile',
          error: error.message || 'Internal server error',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginUserDto: LoginUserDto): Promise<LoginResponseDto> {
    try {
      const result = await this.userService.login(
        loginUserDto.email,
        loginUserDto.password,
      );
      return {
        accessToken: result.session?.access_token || '',
        refreshToken: result.session?.refresh_token,
        userId: result.user?.id || '',
        email: result.user?.email || '',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error logging in',
          error: error.message,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('check-email-verified')
  async checkEmailVerified(
    @Body(ValidationPipe) checkEmailVerifiedDto: CheckEmailVerifiedDto
  ): Promise<CheckEmailVerifiedResponseDto> {
    try {
      const isVerified = await this.userService.isEmailVerified(checkEmailVerifiedDto.userId);
      return {
        success: true,
        isVerified,
        message: isVerified ? 'Email is verified' : 'Email is not verified',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Error checking email verification status',
          error: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
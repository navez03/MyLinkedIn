
import { Controller, Post, Body, ValidationPipe, HttpStatus, HttpException, Get, Query } from '@nestjs/common';
import { UserService } from './userService';
import { RegisterUserDto, RegisterResponseDto } from './dto/register-user.dto';
import { LoginUserDto, LoginResponseDto } from './dto/login-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CheckEmailVerifiedDto, CheckEmailVerifiedResponseDto } from './dto/check-email-verified.dto';
import { GetUserProfileDto, UserProfileResponseDto } from './dto/get-user-profile.dto';
import { GetAllUsersDto, GetAllUsersResponseDto } from './dto/get-all-users.dto';

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

      return {
        success: true,
        message: 'Account created successfully! Please check your email to confirm your account.',
        user: {
          id: result.user.id,
          email: result.user.email!,
        },
      };
    } catch (error) {
      this.handleException(error, 'Error creating account');
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
      this.handleException(error, 'Error creating profile');
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
      this.handleException(error, 'Error logging in', HttpStatus.UNAUTHORIZED);
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
      this.handleException(error, 'Error checking email verification status');
    }
  }

  @Get('profile')
  async getUserProfile(
    @Query(ValidationPipe) getUserProfileDto: GetUserProfileDto
  ): Promise<UserProfileResponseDto> {
    try {
      const userProfile = await this.userService.getUserProfile(getUserProfileDto.userId);
      return {
        success: true,
        data: userProfile,
      };
    } catch (error) {
      this.handleException(error, 'Error fetching user profile');
    }
  }

  @Get('all')
  async getAllUsers(
    @Query(ValidationPipe) getAllUsersDto: GetAllUsersDto
  ): Promise<GetAllUsersResponseDto> {
    try {
      const users = await this.userService.getAllUsers(getAllUsersDto.userId);
      return {
        success: true,
        message: 'Users fetched successfully',
        users,
      };
    } catch (error) {
      this.handleException(error, 'Error fetching users');
    }
  }

  @Get('search')
  async searchUsers(
    @Query('query') query: string,
    @Query('userId') userId: string
  ): Promise<GetAllUsersResponseDto> {
    try {
      const users = await this.userService.searchUsers(query, userId);
      return {
        success: true,
        message: 'Users fetched successfully',
        users,
      };
    } catch (error) {
      this.handleException(error, 'Error searching users');
    }
  }

  private handleException(error: any, defaultMessage: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    if (error instanceof HttpException) {
      throw error;
    }
    console.error('Unexpected error:', error);
    throw new HttpException(
      {
        success: false,
        message: defaultMessage,
        error: error.message || 'Internal server error',
      },
      status,
    );
  }
}
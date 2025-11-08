
import { Controller, Post, Body, ValidationPipe, HttpStatus, HttpException, Get, Query, UseGuards, Logger, Param, Put, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './userService';
import { SessionService } from './sessionService';
import { AuthGuard } from './userGuard';
import { CurrentUser, GetToken } from '../config/decorators';
import { RegisterUserDto, RegisterResponseDto } from './dto/register-user.dto';
import { LoginUserDto, LoginResponseDto } from './dto/login-user.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { CheckEmailVerifiedDto, CheckEmailVerifiedResponseDto } from './dto/check-email-verified.dto';
import { UserProfileResponseDto } from './dto/get-user-profile.dto';
import { GetAllUsersResponseDto } from './dto/get-all-users.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(
    private readonly userService: UserService,
    private readonly sessionService: SessionService
  ) { }

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
      this.logger.error('Registration error', error.message);
      this.handleException(error, 'Error creating account');
    }
  }

  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@GetToken() token: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.userService.logout(token);
      return result;
    } catch (error) {
      this.logger.error('Logout error', error.message);
      this.handleException(error, 'Erro ao fazer logout');
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

      this.logger.log(`User logged in successfully: ${result.user?.id}`);

      return {
        accessToken: result.session?.access_token || '',
        refreshToken: result.session?.refresh_token,
        userId: result.user?.id || '',
        email: result.user?.email || '',
      };
    } catch (error) {
      this.logger.error('Login error', error.message);
      this.handleException(error, 'Invalid credentials', HttpStatus.UNAUTHORIZED);
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
  @UseGuards(AuthGuard)
  async getUserProfile(
    @GetToken() token: string
  ): Promise<UserProfileResponseDto> {
    try {
      const userProfile = await this.userService.getUserProfile(token);
      return {
        success: true,
        data: userProfile,
      };
    } catch (error) {
      this.logger.error('Get profile error', error.message);
      this.handleException(error, 'Error fetching user profile');
    }
  }

  @Get('profile/:userId')
  @UseGuards(AuthGuard)
  async getUserProfileById(
    @GetToken() token: string,
    @Param('userId') userId: string
  ): Promise<UserProfileResponseDto> {
    try {
      const userProfile = await this.userService.getUserProfileById(userId, token);
      return {
        success: true,
        data: userProfile,
      };
    } catch (error) {
      this.logger.error('Get profile by ID error', error.message);
      this.handleException(error, 'Error fetching user profile');
    }
  }

  @Get('all')
  @UseGuards(AuthGuard)
  async getAllUsers(
    @GetToken() token: string
  ): Promise<GetAllUsersResponseDto> {
    try {
      const users = await this.userService.getAllUsers(token);
      return {
        success: true,
        message: 'Users fetched successfully',
        users,
      };
    } catch (error) {
      this.logger.error('Get all users error', error.message);
      this.handleException(error, 'Error fetching users');
    }
  }

  @Put('profile')
  @UseGuards(AuthGuard)
  async updateUserProfile(
    @CurrentUser() currentUser: any,
    @Body(ValidationPipe) updateProfileDto: UpdateProfileDto
  ): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Updating profile for user ${currentUser.id} with data: ${JSON.stringify(updateProfileDto)}`);
      await this.userService.updateUserProfile(currentUser.id, updateProfileDto);
      return {
        success: true,
        message: 'Profile updated successfully',
      };
    } catch (error) {
      this.logger.error('Error updating profile', error.message);
      this.logger.error('Error stack:', error.stack);
      this.handleException(error, 'Failed to update profile');
    }
  }

  @Get('search')
  @UseGuards(AuthGuard)
  async searchUsers(
    @Query('query') query: string,
    @GetToken() token: string
  ): Promise<GetAllUsersResponseDto> {
    try {
      const users = await this.userService.searchUsers(query, token);
      return {
        success: true,
        message: 'Users fetched successfully',
        users,
      };
    } catch (error) {
      this.logger.error('Search users error', error.message);
      this.handleException(error, 'Error searching users');
    }
  }

  @Post('refresh')
  async refreshSession(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const result = await this.sessionService.refreshSession(refreshTokenDto.refresh_token);

      return {
        success: true,
        message: 'Session refreshed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Session refresh error', error.message);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to refresh session',
        },
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('upload-avatar')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser() currentUser: any,
    @GetToken() token: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|jpg|png|gif|webp)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data: { url: string } }> {
    try {
      const avatarUrl = await this.userService.uploadAvatar(currentUser.id, file, token);

      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          url: avatarUrl
        },
      };
    } catch (error) {
      this.logger.error('Upload avatar error', error.message);
      this.handleException(error, 'Error uploading avatar');
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
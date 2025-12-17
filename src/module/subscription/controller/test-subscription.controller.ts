import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';
import { SubscriptionGuard } from 'src/common/guard/subscription.guard';
import { PlanGuard } from 'src/common/guard/plan.guard';
import {
  RequiredPlans,
  PaidPlansOnly,
  PremiumOnly,
  AllPlans,
} from 'src/common/decorator/plan.decorator';
import { PlanType } from 'src/module/plan/const/plan.const';
import { User } from 'src/common/decorator/user.decorator';

@ApiTags('Test Subscription')
@ApiBearerAuth()
@Controller({
  path: 'test-subscription',
  version: '1',
})
export class TestSubscriptionController {
  /**
   * Test 1: Endpoint công khai - không cần subscription
   */
  @Get('public')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Endpoint công khai - chỉ cần đăng nhập' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  publicEndpoint(@User('userId') userId: string) {
    return {
      message: 'Đây là endpoint công khai, ai đăng nhập cũng vào được',
      userId,
      quality: '480p SD',
    };
  }

  /**
   * Test 2: Kiểm tra có subscription active không (bất kỳ gói nào)
   */
  @Get('has-subscription')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @ApiOperation({ summary: 'Yêu cầu có subscription active' })
  @ApiResponse({ status: 200, description: 'Có subscription' })
  @ApiResponse({ status: 403, description: 'Không có subscription' })
  hasSubscription(@User('userId') userId: string) {
    return {
      message: 'Bạn có subscription đang hoạt động!',
      userId,
    };
  }

  /**
   * Test 3: Cho phép tất cả plan (kể cả Free)
   */
  @Get('all-plans')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @AllPlans()
  @ApiOperation({ summary: 'Cho phép tất cả plan (kể cả Free)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  allPlansEndpoint(@User('userId') userId: string) {
    return {
      message: 'Tất cả các gói đều truy cập được',
      userId,
      allowedPlans: ['FREE', 'BASIC (Pro)', 'PREMIUM'],
    };
  }

  /**
   * Test 4: Chỉ user trả phí (Pro trở lên) - Xem 1080p
   */
  @Get('paid-only')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @PaidPlansOnly()
  @ApiOperation({ summary: 'Chỉ gói trả phí - Xem 1080p' })
  @ApiResponse({ status: 200, description: 'Có quyền xem 1080p' })
  @ApiResponse({ status: 403, description: 'Cần nâng cấp gói' })
  paidOnlyEndpoint(@User('userId') userId: string) {
    return {
      message: 'Bạn có thể xem chất lượng Full HD 1080p!',
      userId,
      quality: '1080p Full HD',
      allowedPlans: ['BASIC (Pro)', 'PREMIUM'],
    };
  }

  /**
   * Test 5: Chỉ Premium trở lên - Xem 2K
   */
  @Get('premium-only')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @PremiumOnly()
  @ApiOperation({ summary: 'Chỉ gói Premium - Xem 2K' })
  @ApiResponse({ status: 200, description: 'Có quyền xem 2K' })
  @ApiResponse({ status: 403, description: 'Cần nâng cấp lên Premium' })
  premiumOnlyEndpoint(@User('userId') userId: string) {
    return {
      message: 'Bạn có thể xem chất lượng 2K QHD!',
      userId,
      quality: '2K QHD (1440p)',
      allowedPlans: ['PREMIUM'],
    };
  }

  /**
   * Test 6: Chỉ định plan cụ thể - chỉ BASIC (Pro)
   */
  @Get('pro-only')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequiredPlans(PlanType.BASIC)
  @ApiOperation({ summary: 'Chỉ gói Pro (BASIC)' })
  @ApiResponse({ status: 200, description: 'Đang dùng gói Pro' })
  @ApiResponse({ status: 403, description: 'Không phải gói Pro' })
  proOnlyEndpoint(@User('userId') userId: string) {
    return {
      message: 'Bạn đang dùng gói Pro!',
      userId,
      currentPlan: 'Pro (BASIC)',
    };
  }

  /**
   * Test 7: Cho phép FREE hoặc PREMIUM (bỏ qua Pro)
   */
  @Get('free-or-premium')
  @UseGuards(JwtAuthGuard, PlanGuard)
  @RequiredPlans(PlanType.FREE, PlanType.PREMIUM)
  @ApiOperation({ summary: 'Chỉ Free hoặc Premium (không cho Pro)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 403, description: 'Gói Pro không được phép' })
  freeOrPremiumEndpoint(@User('userId') userId: string) {
    return {
      message: 'Bạn đang dùng gói Free hoặc Premium!',
      userId,
      allowedPlans: ['FREE', 'PREMIUM'],
      note: 'Gói Pro không được phép trong endpoint này (test case đặc biệt)',
    };
  }
}

import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReviewReaction } from "../entity/review-reaction.entity";
import { ReviewReport } from "../entity/review-report.entity";
import { Review } from "../entity/review.entity";
import { CreateReviewReactionDto, ReviewReactionResponseDto } from "../dto/review-reaction.dto";
import { ERROR_MESSAGES } from "src/common/const/const";
import { ReactionType, ReportReason } from "src/module/comment/const/const";

@Injectable()
export class ReviewReactionService {
    constructor(
        @InjectRepository(ReviewReaction)
        private readonly reactionRepository: Repository<ReviewReaction>,
        @InjectRepository(ReviewReport)
        private readonly reportRepository: Repository<ReviewReport>,
        @InjectRepository(Review)
        private readonly reviewRepository: Repository<Review>,
    ) {}

    async react(userId: string, dto: CreateReviewReactionDto): Promise<ReviewReactionResponseDto> {
        const review = await this.reviewRepository.findOne({ where: { id: dto.reviewId } });
        if (!review) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        const existingReaction = await this.reactionRepository.findOne({
            where: { userId, reviewId: dto.reviewId },
        });

        if (existingReaction) {
            if (existingReaction.type === dto.type) {
                // Toggle off - xóa reaction
                await this.reactionRepository.delete({ id: existingReaction.id });
                
                // Cập nhật count
                if (dto.type === ReactionType.LIKE) {
                    review.totalLikes = Math.max(0, review.totalLikes - 1);
                } else {
                    review.totalDislikes = Math.max(0, review.totalDislikes - 1);
                }
                await this.reviewRepository.save(review);

                return {
                    totalLikes: review.totalLikes,
                    totalDislikes: review.totalDislikes,
                    userReaction: null,
                };
            } else {
                // Đổi loại reaction
                const oldType = existingReaction.type;
                existingReaction.type = dto.type;
                await this.reactionRepository.save(existingReaction);

                // Cập nhật count
                if (oldType === ReactionType.LIKE) {
                    review.totalLikes = Math.max(0, review.totalLikes - 1);
                    review.totalDislikes += 1;
                } else {
                    review.totalDislikes = Math.max(0, review.totalDislikes - 1);
                    review.totalLikes += 1;
                }
                await this.reviewRepository.save(review);

                return {
                    totalLikes: review.totalLikes,
                    totalDislikes: review.totalDislikes,
                    userReaction: dto.type,
                };
            }
        } else {
            // Tạo reaction mới
            await this.reactionRepository.save({
                userId,
                reviewId: dto.reviewId,
                type: dto.type,
            });

            // Cập nhật count
            if (dto.type === ReactionType.LIKE) {
                review.totalLikes += 1;
            } else {
                review.totalDislikes += 1;
            }
            await this.reviewRepository.save(review);

            return {
                totalLikes: review.totalLikes,
                totalDislikes: review.totalDislikes,
                userReaction: dto.type,
            };
        }
    }

    async report(userId: string, reviewId: string, reason: ReportReason, description?: string): Promise<ReviewReport> {
        const review = await this.reviewRepository.findOne({ where: { id: reviewId } });
        if (!review) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        // Kiểm tra xem user đã report review này chưa
        const existingReport = await this.reportRepository.findOne({
            where: { userId, reviewId },
        });

        if (existingReport) {
            throw new BadRequestException('Bạn đã báo cáo đánh giá này rồi');
        }

        // Không cho phép tự report đánh giá của mình
        if (review.authorId === userId) {
            throw new BadRequestException('Bạn không thể báo cáo đánh giá của chính mình');
        }

        return await this.reportRepository.save({
            userId,
            reviewId,
            reason,
            description,
        });
    }
}

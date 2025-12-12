import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CommentReaction } from "../entity/comment-reaction.entity";
import { CommentReport } from "../entity/comment-report.entity";
import { Comment } from "../entity/comment.entity";
import { CreateCommentReactionDto, CommentReactionResponseDto } from "../dto/comment-reaction.dto";
import { ERROR_MESSAGES } from "src/common/const/const";
import { ReactionType, ReportReason } from "../const/const";

@Injectable()
export class CommentReactionService {
    constructor(
        @InjectRepository(CommentReaction)
        private readonly reactionRepository: Repository<CommentReaction>,
        @InjectRepository(CommentReport)
        private readonly reportRepository: Repository<CommentReport>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) {}

    async react(userId: string, dto: CreateCommentReactionDto): Promise<CommentReactionResponseDto> {
        const comment = await this.commentRepository.findOne({ where: { id: dto.commentId } });
        if (!comment) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        const existingReaction = await this.reactionRepository.findOne({
            where: { userId, commentId: dto.commentId },
        });

        if (existingReaction) {
            if (existingReaction.type === dto.type) {
                // Toggle off - xóa reaction
                await this.reactionRepository.delete({ id: existingReaction.id });
                
                // Cập nhật count
                if (dto.type === ReactionType.LIKE) {
                    comment.totalLikes = Math.max(0, comment.totalLikes - 1);
                } else {
                    comment.totalDislikes = Math.max(0, comment.totalDislikes - 1);
                }
                await this.commentRepository.save(comment);

                return {
                    totalLikes: comment.totalLikes,
                    totalDislikes: comment.totalDislikes,
                    userReaction: null,
                };
            } else {
                // Đổi loại reaction
                const oldType = existingReaction.type;
                existingReaction.type = dto.type;
                await this.reactionRepository.save(existingReaction);

                // Cập nhật count
                if (oldType === ReactionType.LIKE) {
                    comment.totalLikes = Math.max(0, comment.totalLikes - 1);
                    comment.totalDislikes += 1;
                } else {
                    comment.totalDislikes = Math.max(0, comment.totalDislikes - 1);
                    comment.totalLikes += 1;
                }
                await this.commentRepository.save(comment);

                return {
                    totalLikes: comment.totalLikes,
                    totalDislikes: comment.totalDislikes,
                    userReaction: dto.type,
                };
            }
        } else {
            // Tạo reaction mới
            await this.reactionRepository.save({
                userId,
                commentId: dto.commentId,
                type: dto.type,
            });

            // Cập nhật count
            if (dto.type === ReactionType.LIKE) {
                comment.totalLikes += 1;
            } else {
                comment.totalDislikes += 1;
            }
            await this.commentRepository.save(comment);

            return {
                totalLikes: comment.totalLikes,
                totalDislikes: comment.totalDislikes,
                userReaction: dto.type,
            };
        }
    }

    async report(userId: string, commentId: string, reason: ReportReason, description?: string): Promise<CommentReport> {
        const comment = await this.commentRepository.findOne({ where: { id: commentId } });
        if (!comment) {
            throw new NotFoundException(ERROR_MESSAGES.NOT_FOUND);
        }

        // Kiểm tra xem user đã report comment này chưa
        const existingReport = await this.reportRepository.findOne({
            where: { userId, commentId },
        });

        if (existingReport) {
            throw new BadRequestException('Bạn đã báo cáo bình luận này rồi');
        }

        // Không cho phép tự report bình luận của mình
        if (comment.authorId === userId) {
            throw new BadRequestException('Bạn không thể báo cáo bình luận của chính mình');
        }

        return await this.reportRepository.save({
            userId,
            commentId,
            reason,
            description,
        });
    }
}

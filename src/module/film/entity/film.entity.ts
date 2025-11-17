import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from './category.entity';

@Entity()
export class Film {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  poster: string;

  @Column({ default: 0 })
  views: number;

  @Column({ type: 'float', default: 0 })
  rating: number;

  @Column({ type: 'timestamp', nullable: true })
  releaseDate: Date | null;

  @ManyToOne(() => Category, (category) => category.films, { eager: true })
  category: Category;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

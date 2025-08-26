import { Common } from '@ac-assignment/shared-types';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  status: Common.LoadingStatus;

  @Column()
  filePath: string;

  @Column({ nullable: true })
  error: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

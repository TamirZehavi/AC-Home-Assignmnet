import { Common } from '@ac-assignment/shared-types';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
}

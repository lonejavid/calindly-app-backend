import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { IntegrationAppTypeEnum } from "./integration.entity";
import { User } from "./user.entity";
import { Meeting } from "./meeting.entity";

export enum EventLocationEnumType {
  GOOGLE_MEET_AND_CALENDAR = IntegrationAppTypeEnum.GOOGLE_MEET_AND_CALENDAR,
  ZOOM_MEETING = IntegrationAppTypeEnum.ZOOM_MEETING,
}

export enum AccessSpecifierEnum {
  ALLOW_ALL = "allow_all",
  DISABLE_PUBLIC = "disable_public",
}

@Entity({ name: "events" })
export class Event {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  title: string;

  @Column({
    type: "enum",
    enum: AccessSpecifierEnum,
    default: AccessSpecifierEnum.ALLOW_ALL,
  })
  accessSpecifier: AccessSpecifierEnum;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 30 })
  duration: number;

  @Column({ nullable: false })
  slug: string;

  @Column({ default: false })
  isPrivate: boolean;

  @Column({
    type: "enum",
    enum: EventLocationEnumType,
  })
  locationType: EventLocationEnumType;

  @ManyToOne(() => User, (user) => user.events)
  user: User;

  @OneToMany(() => Meeting, (meeting) => meeting.event)
  meetings: Meeting[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

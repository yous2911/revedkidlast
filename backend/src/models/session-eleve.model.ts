import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Eleve } from './eleve.model';

@Table({
  tableName: 'sessions_eleves',
  timestamps: true
})
export class SessionEleve extends Model {
  override id!: number;

  @ForeignKey(() => Eleve)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  eleveId!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  dateDebut!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  dateFin?: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  exercicesReussis!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  exercicesTentes!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  pointsGagnes!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  dureeMinutes!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  sessionTerminee!: boolean;

  @Column({
    type: DataType.JSONB,
    defaultValue: {}
  })
  metadata!: any;

  override createdAt!: Date;

  override updatedAt!: Date;

  // Relations
  @BelongsTo(() => Eleve)
  eleve!: Eleve;
} 
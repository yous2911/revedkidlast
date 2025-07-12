import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { ExercicePedagogique } from './exercice-pedagogique.model';

@Table({
  tableName: 'modules_pedagogiques',
  timestamps: true
})
export class ModulePedagogique extends Model {
  override id!: number;

  @Column({
    type: DataType.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  })
  titre!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true
  })
  description?: string;

  @Column({
    type: DataType.ENUM('CP', 'CE1', 'CE2', 'CM1', 'CM2'),
    allowNull: false
  })
  niveau!: string;

  @Column({
    type: DataType.ENUM('MATHEMATIQUES', 'FRANCAIS', 'SCIENCES', 'HISTOIRE_GEOGRAPHIE', 'ANGLAIS'),
    allowNull: false
  })
  matiere!: string;

  @Column({
    type: DataType.ENUM('P1', 'P2', 'P3', 'P4', 'P5'),
    allowNull: false
  })
  periode!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  })
  ordre!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  actif!: boolean;

  @Column({
    type: DataType.JSONB,
    defaultValue: {}
  })
  metadata!: any;

  override createdAt!: Date;

  override updatedAt!: Date;

  // Relations
  @HasMany(() => ExercicePedagogique)
  exercices!: ExercicePedagogique[];
} 
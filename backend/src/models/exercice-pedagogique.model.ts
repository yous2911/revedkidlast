import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { ModulePedagogique } from './module-pedagogique.model';
import { ProgressionEleve } from './progression-eleve.model';

@Table({
  tableName: 'exercices_pedagogiques',
  timestamps: true
})
export class ExercicePedagogique extends Model {
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
    allowNull: false
  })
  consigne!: string;

  @Column({
    type: DataType.ENUM('QCM', 'CALCUL', 'TEXTE_LIBRE', 'DRAG_DROP', 'CONJUGAISON', 'LECTURE', 'GEOMETRIE', 'PROBLEME'),
    allowNull: false
  })
  type!: string;

  @Column({
    type: DataType.ENUM('decouverte', 'consolidation', 'maitrise'),
    defaultValue: 'decouverte'
  })
  difficulte!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 10,
    validate: {
      min: 1,
      max: 100
    }
  })
  pointsReussite!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 60
    }
  })
  dureeEstimee!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  })
  ordre!: number;

  @ForeignKey(() => ModulePedagogique)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  moduleId!: number;

  @Column({
    type: DataType.JSONB,
    allowNull: false
  })
  configuration!: any;

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
  @BelongsTo(() => ModulePedagogique)
  module!: ModulePedagogique;

  @HasMany(() => ProgressionEleve)
  progressions!: ProgressionEleve[];
} 
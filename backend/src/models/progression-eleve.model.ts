import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Eleve } from './eleve.model';
import { ExercicePedagogique } from './exercice-pedagogique.model';

@Table({
  tableName: 'progressions_eleves',
  timestamps: true
})
export class ProgressionEleve extends Model {
  override id!: number;

  @ForeignKey(() => Eleve)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  eleveId!: number;

  @ForeignKey(() => ExercicePedagogique)
  @Column({
    type: DataType.INTEGER,
    allowNull: false
  })
  exerciceId!: number;

  @Column({
    type: DataType.ENUM('NON_COMMENCE', 'EN_COURS', 'TERMINE', 'MAITRISE'),
    defaultValue: 'NON_COMMENCE'
  })
  statut!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  nombreTentatives!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  nombreReussites!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  })
  tauxReussite!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  pointsGagnes!: number;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  derniereTentative?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  premiereReussite?: Date;

  @Column({
    type: DataType.JSONB,
    defaultValue: []
  })
  historique!: any[];

  override createdAt!: Date;

  override updatedAt!: Date;

  // Relations
  @BelongsTo(() => Eleve)
  eleve!: Eleve;

  @BelongsTo(() => ExercicePedagogique)
  exercice!: ExercicePedagogique;
} 
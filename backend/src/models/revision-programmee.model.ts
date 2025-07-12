import { Table, Column, Model, DataType, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Eleve } from './eleve.model';
import { ExercicePedagogique } from './exercice-pedagogique.model';

@Table({
  tableName: 'revisions_programmees',
  timestamps: true
})
export class RevisionProgrammee extends Model {
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
    type: DataType.DATE,
    allowNull: false
  })
  prochaineRevision!: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  })
  intervalleJours!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  nombreRevisions!: number;

  @Column({
    type: DataType.DECIMAL(3, 2),
    defaultValue: 1.0,
    validate: {
      min: 0.1,
      max: 5.0
    }
  })
  facteurDifficulte!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  revisionEffectuee!: boolean;

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

  @BelongsTo(() => ExercicePedagogique)
  exercice!: ExercicePedagogique;
} 
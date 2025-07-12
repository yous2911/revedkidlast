import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { ProgressionEleve } from './progression-eleve.model';
import { SessionEleve } from './session-eleve.model';
import { RevisionProgrammee } from './revision-programmee.model';

@Table({
  tableName: 'eleves',
  timestamps: true
})
export class Eleve extends Model {
  override id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50],
      notEmpty: true
    }
  })
  prenom!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    validate: {
      len: [2, 50],
      notEmpty: true
    }
  })
  nom!: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false
  })
  dateNaissance!: Date;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 5,
      max: 12
    }
  })
  age!: number;

  @Column({
    type: DataType.ENUM('CP', 'CE1', 'CE2', 'CM1', 'CM2'),
    allowNull: false
  })
  niveauActuel!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    validate: {
      isEmail: true
    }
  })
  emailParent?: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  totalPoints!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  })
  serieJours!: number;

  @Column({
    type: DataType.JSONB,
    defaultValue: {}
  })
  preferences!: any;

  @Column({
    type: DataType.JSONB,
    defaultValue: {}
  })
  adaptations!: any;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  dernierAcces?: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  estConnecte!: boolean;

  override createdAt!: Date;

  override updatedAt!: Date;

  // Relations
  @HasMany(() => ProgressionEleve)
  progressions!: ProgressionEleve[];

  @HasMany(() => SessionEleve)
  sessions!: SessionEleve[];

  @HasMany(() => RevisionProgrammee)
  revisions!: RevisionProgrammee[];
} 
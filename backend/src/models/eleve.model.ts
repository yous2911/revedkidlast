import { Table, Column, Model, DataType, HasMany, Index } from 'sequelize-typescript';
import { ProgressionEleve } from './progression-eleve.model';
import { SessionEleve } from './session-eleve.model';
import { RevisionProgrammee } from './revision-programmee.model';

@Table({
  tableName: 'eleves',
  timestamps: true,
  indexes: [
    {
      name: 'idx_eleves_email_parent',
      fields: ['emailParent']
    },
    {
      name: 'idx_eleves_niveau_actuel',
      fields: ['niveauActuel']
    },
    {
      name: 'idx_eleves_est_connecte',
      fields: ['estConnecte']
    },
    {
      name: 'idx_eleves_dernier_acces',
      fields: ['dernierAcces']
    }
  ]
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

  @Index
  @Column({
    type: DataType.ENUM('CP', 'CE1', 'CE2', 'CM1', 'CM2'),
    allowNull: false
  })
  niveauActuel!: string;

  @Index
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

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  dernierAcces?: Date;

  @Index
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

  // Instance methods for better functionality
  
  /**
   * Get student's full name
   */
  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }

  /**
   * Check if student is active (accessed within last 30 days)
   */
  isActive(): boolean {
    if (!this.dernierAcces) return false;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.dernierAcces > thirtyDaysAgo;
  }

  /**
   * Get student's age group for level recommendations
   */
  getAgeGroup(): 'young' | 'middle' | 'older' {
    if (this.age <= 7) return 'young';
    if (this.age <= 9) return 'middle';
    return 'older';
  }

  /**
   * Calculate student's level based on grade
   */
  getNumericalLevel(): number {
    const levelMap: Record<string, number> = {
      'CP': 1,
      'CE1': 2,
      'CE2': 3,
      'CM1': 4,
      'CM2': 5
    };
    return levelMap[this.niveauActuel] || 1;
  }

  /**
   * Check if student needs parent supervision based on age
   */
  needsParentSupervision(): boolean {
    return this.age < 8;
  }

  /**
   * Update login status and last access
   */
  async updateLoginStatus(isConnected: boolean = true): Promise<void> {
    await this.update({
      estConnecte: isConnected,
      dernierAcces: new Date()
    });
  }

  /**
   * Add points to student's total
   */
  async addPoints(points: number): Promise<void> {
    if (points < 0) {
      throw new Error('Points cannot be negative');
    }
    await this.update({
      totalPoints: this.totalPoints + points
    });
  }

  /**
   * Update daily streak
   */
  async updateDailyStreak(): Promise<void> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!this.dernierAcces) {
      // First time logging in
      await this.update({ serieJours: 1 });
    } else {
      const lastAccessDate = new Date(this.dernierAcces);
      lastAccessDate.setHours(0, 0, 0, 0);
      yesterday.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (lastAccessDate.getTime() === yesterday.getTime()) {
        // Consecutive day - increment streak
        await this.update({ serieJours: this.serieJours + 1 });
      } else if (lastAccessDate.getTime() !== today.getTime()) {
        // Gap in days - reset streak
        await this.update({ serieJours: 1 });
      }
      // If lastAccessDate === today, don't change streak
    }
  }

  /**
   * Safely update preferences with validation
   */
  async updatePreferences(newPreferences: Record<string, any>): Promise<void> {
    const safePreferences = { ...this.preferences, ...newPreferences };
    
    // Validate preferences structure
    const allowedKeys = ['theme', 'difficulty', 'soundEnabled', 'animationsEnabled', 'language'];
    const filteredPreferences = Object.keys(safePreferences)
      .filter(key => allowedKeys.includes(key))
      .reduce((obj: Record<string, any>, key) => {
        obj[key] = safePreferences[key];
        return obj;
      }, {});

    await this.update({ preferences: filteredPreferences });
  }

  /**
   * Safely update adaptations with validation
   */
  async updateAdaptations(newAdaptations: Record<string, any>): Promise<void> {
    const safeAdaptations = { ...this.adaptations, ...newAdaptations };
    
    // Validate adaptations structure
    const allowedKeys = ['dyslexia', 'colorBlind', 'hearing', 'motor', 'attention'];
    const filteredAdaptations = Object.keys(safeAdaptations)
      .filter(key => allowedKeys.includes(key))
      .reduce((obj: Record<string, any>, key) => {
        obj[key] = safeAdaptations[key];
        return obj;
      }, {});

    await this.update({ adaptations: filteredAdaptations });
  }
} 
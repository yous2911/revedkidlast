import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { Eleve } from '../models/eleve.model';
import { ProgressionEleve } from '../models/progression-eleve.model';
import { SessionEleve } from '../models/session-eleve.model';
import { ExercicePedagogique } from '../models/exercice-pedagogique.model';
import { ModulePedagogique } from '../models/module-pedagogique.model';
import { asyncHandler } from '../middleware/errorHandler';
import { cacheService } from '../services/cache.service';
import { Op } from 'sequelize';

export class EleveController extends BaseController {
  protected nomController = 'EleveController';

  // Get student by ID
  getEleve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveId = parseInt(req.params.id);
    
    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const eleve = await Eleve.findByPk(eleveId, {
      attributes: { exclude: ['emailParent'] } // Don't expose sensitive data
    });

    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    // Update last access
    await eleve.update({ dernierAcces: new Date() });

    this.repondreSucces(res, {
      id: eleve.id,
      prenom: eleve.prenom,
      nom: eleve.nom,
      niveauActuel: eleve.niveauActuel,
      age: eleve.age,
      totalPoints: eleve.totalPoints,
      serieJours: eleve.serieJours,
      preferences: eleve.preferences,
      dernierAcces: eleve.dernierAcces,
      estConnecte: eleve.estConnecte
    }, 'Données élève récupérées avec succès');
  });

  // Get recommended exercises
  getExercicesRecommandes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveId = parseInt(req.params.id);
    const limite = Math.min(parseInt(req.query.limite as string) || 5, 20);

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    // Check if student exists
    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    try {
      // Try to get cached recommendations first
      const cachedRecommendations = await cacheService.getCachedStudentRecommendations(eleveId);
      if (cachedRecommendations) {
        this.log(`Cache HIT for student ${eleveId} recommendations`);
        this.repondreSucces(res, cachedRecommendations.slice(0, limite), 
          `${cachedRecommendations.length} exercices recommandés (cache)`);
        return;
      }

      // Cache miss - get from database
      this.log(`Cache MISS for student ${eleveId} recommendations`);
      
      // Get exercises not yet completed by the student
      const exercicesVus = await ProgressionEleve.findAll({
        where: { eleveId },
        attributes: ['exerciceId']
      });

      const exerciceIdsVus = exercicesVus.map(p => p.exerciceId);

      const exercices = await ExercicePedagogique.findAll({
        where: {
          id: { [Op.notIn]: exerciceIdsVus },
          actif: true
        },
        include: [{
          model: ModulePedagogique,
          where: { 
            niveau: eleve.niveauActuel,
            actif: true
          }
        }],
        order: [['ordre', 'ASC']],
        limit: limite
      });

      const exercicesFormatted = exercices.map(ex => ({
        id: ex.id,
        titre: ex.titre,
        consigne: ex.consigne,
        type: ex.type,
        difficulte: ex.difficulte,
        pointsReussite: ex.pointsReussite,
        dureeEstimee: ex.dureeEstimee,
        module: {
          titre: ex.module?.titre,
          niveau: ex.module?.niveau,
          matiere: ex.module?.matiere
        }
      }));

      // Cache the recommendations for 15 minutes
      await cacheService.cacheStudentRecommendations(eleveId, exercicesFormatted, 900);

      this.repondreSucces(res, exercicesFormatted, 
        `${exercicesFormatted.length} exercices recommandés`);
    } catch (error) {
      this.logError('Erreur recommandations exercices', error);
      this.repondreErreur(res, 'Impossible de récupérer les recommandations', 500, 'RECOMMENDATION_ERROR');
    }
  });

  // Submit exercise attempt
  soumettreExercice = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveId = parseInt(req.params.id);
    const { exerciceId, tentative } = req.body;

    // Validate student exists
    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    // Validate exercise exists
    const exercice = await ExercicePedagogique.findByPk(exerciceId);
    if (!exercice) {
      this.repondreErreur(res, `Exercice avec l'ID ${exerciceId} non trouvé`, 404, 'EXERCISE_NOT_FOUND');
      return;
    }

    // Validate tentative structure
    if (!tentative || typeof tentative !== 'object') {
      this.repondreErreur(res, 'Données de tentative invalides', 400, 'INVALID_ATTEMPT_DATA');
      return;
    }

    const { reponse, reussi, tempsSecondes, aidesUtilisees = 0 } = tentative;

    if (typeof reussi !== 'boolean') {
      this.repondreErreur(res, 'Statut de réussite requis', 400, 'MISSING_SUCCESS_STATUS');
      return;
    }

    if (!Number.isInteger(tempsSecondes) || tempsSecondes < 1 || tempsSecondes > 3600) {
      this.repondreErreur(res, 'Temps invalide (1-3600 secondes)', 400, 'INVALID_TIME');
      return;
    }

    try {
      // Calculate points
      const pointsGagnes = reussi ? exercice.pointsReussite : 0;

      // Update or create progression
      const [progression, created] = await ProgressionEleve.findOrCreate({
        where: { eleveId, exerciceId },
        defaults: {
          eleveId,
          exerciceId,
          statut: reussi ? 'TERMINE' : 'EN_COURS',
          nombreTentatives: 1,
          nombreReussites: reussi ? 1 : 0,
          pointsGagnes,
          derniereTentative: new Date(),
          premiereReussite: reussi ? new Date() : null,
          historique: [{
            date: new Date().toISOString(),
            reussi,
            tempsSecondes,
            aidesUtilisees,
            pointsGagnes,
            reponse
          }]
        }
      });

      if (!created) {
        // Update existing progression
        const nouveauStatut = reussi ? 'TERMINE' : 
                             progression.nombreTentatives >= 3 ? 'EN_COURS' : progression.statut;
        
        await progression.update({
          statut: nouveauStatut,
          nombreTentatives: progression.nombreTentatives + 1,
          nombreReussites: progression.nombreReussites + (reussi ? 1 : 0),
          pointsGagnes: progression.pointsGagnes + pointsGagnes,
          derniereTentative: new Date(),
          premiereReussite: reussi && !progression.premiereReussite ? new Date() : progression.premiereReussite,
          historique: [
            ...progression.historique,
            {
              date: new Date().toISOString(),
              reussi,
              tempsSecondes,
              aidesUtilisees,
              pointsGagnes,
              reponse
            }
          ]
        });
      }

      // Update student points and streak
      await eleve.update({
        totalPoints: eleve.totalPoints + pointsGagnes,
        serieJours: reussi ? eleve.serieJours + 1 : 0,
        dernierAcces: new Date()
      });

      // Invalidate cache for this student
      await cacheService.invalidateStudentCache(eleveId);

      // Update or create today's session
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [session] = await SessionEleve.findOrCreate({
        where: {
          eleveId,
          dateDebut: { [Op.between]: [today, tomorrow] }
        },
        defaults: {
          eleveId,
          dateDebut: new Date(),
          exercicesReussis: reussi ? 1 : 0,
          exercicesTentes: 1,
          pointsGagnes,
          dureeMinutes: Math.ceil(tempsSecondes / 60),
          sessionTerminee: false
        }
      });

      if (session) {
        const exercicesReussis = session.exercicesReussis + (reussi ? 1 : 0);
        const exercicesTentes = session.exercicesTentes + 1;
        const pointsTotal = session.pointsGagnes + pointsGagnes;

        await session.update({
          exercicesReussis,
          exercicesTentes,
          pointsGagnes: pointsTotal,
          dateFin: new Date()
        });
      }

      // Calculate final statistics
      const tauxReussite = Math.round((progression.nombreReussites / progression.nombreTentatives) * 100);
      
      this.repondreSucces(res, {
        reussi,
        pointsGagnes,
        nouveauStatut: progression.statut,
        progression: {
          nombreTentatives: progression.nombreTentatives,
          nombreReussites: progression.nombreReussites,
          tauxReussite
        },
        eleve: {
          totalPoints: eleve.totalPoints + pointsGagnes,
          serieJours: reussi ? eleve.serieJours + 1 : 0
        }
      }, 'Tentative enregistrée avec succès');

    } catch (error) {
      this.logError('Erreur soumission exercice', error);
      this.repondreErreur(res, 'Impossible d\'enregistrer la tentative', 500, 'SUBMISSION_ERROR');
    }
  });

  // Get student progress
  getProgression = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveId = parseInt(req.params.id);
    const statut = req.query.statut as string;
    const matiere = req.query.matiere as string;
    const limite = Math.min(parseInt(req.query.limite as string) || 50, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const offset = (page - 1) * limite;

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    // Build where clause
    const whereClause: any = { eleveId };
    if (statut && ['NON_COMMENCE', 'EN_COURS', 'TERMINE', 'MAITRISE'].includes(statut)) {
      whereClause.statut = statut;
    }

    try {
      const { count, rows: progressions } = await ProgressionEleve.findAndCountAll({
        where: whereClause,
        include: [{
          model: ExercicePedagogique,
          include: [{
            model: ModulePedagogique,
            where: matiere ? { matiere } : undefined
          }]
        }],
        order: [['derniereTentative', 'DESC']],
        limit: limite,
        offset
      });

      // Format response
      const progressionsFormatted = progressions.map(p => ({
        exerciceId: p.exerciceId,
        statut: p.statut,
        nombreTentatives: p.nombreTentatives,
        nombreReussites: p.nombreReussites,
        tauxReussite: p.tauxReussite,
        pointsGagnes: p.pointsGagnes,
        derniereTentative: p.derniereTentative,
        premiereReussite: p.premiereReussite,
        exercice: {
          titre: p.exercice.titre,
          type: p.exercice.type,
          difficulte: p.exercice.difficulte,
          module: {
            titre: p.exercice.module.titre,
            niveau: p.exercice.module.niveau,
            matiere: p.exercice.module.matiere
          }
        }
      }));

      this.repondreSucces(res, {
        progressions: progressionsFormatted,
        pagination: {
          total: count,
          page,
          limite,
          totalPages: Math.ceil(count / limite),
          hasMore: offset + limite < count
        }
      }, 'Progression récupérée avec succès');
    } catch (error) {
      this.logError('Erreur récupération progression', error);
      this.repondreErreur(res, 'Impossible de récupérer la progression', 500, 'PROGRESS_ERROR');
    }
  });

  // Get student sessions
  getSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveId = parseInt(req.params.id);
    const jours = Math.min(parseInt(req.query.jours as string) || 30, 90);

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const dateDebut = new Date();
    dateDebut.setDate(dateDebut.getDate() - jours);

    try {
      const sessions = await SessionEleve.findAll({
        where: {
          eleveId,
          dateDebut: { [Op.gte]: dateDebut }
        },
        order: [['dateDebut', 'DESC']],
        limit: 100
      });

      // Calculate analytics
      const totalSessions = sessions.length;
      const tempsTotal = sessions.reduce((sum, s) => sum + s.dureeMinutes, 0);
      const exercicesReussis = sessions.reduce((sum, s) => sum + s.exercicesReussis, 0);
      const exercicesTentes = sessions.reduce((sum, s) => sum + s.exercicesTentes, 0);
      const pointsTotal = sessions.reduce((sum, s) => sum + s.pointsGagnes, 0);
      
      const analytics = {
        totalSessions,
        tempsTotal,
        tempsMoyen: totalSessions > 0 ? Math.round(tempsTotal / totalSessions) : 0,
        exercicesReussis,
        exercicesTentes,
        tauxReussiteGlobal: exercicesTentes > 0 ? Math.round((exercicesReussis / exercicesTentes) * 100) : 0,
        pointsTotal,
        derniereSession: sessions[0]?.dateDebut || null
      };

      this.repondreSucces(res, {
        sessions: sessions.slice(0, 20), // Limit detailed sessions
        analytics
      }, 'Sessions récupérées avec succès');
    } catch (error) {
      this.logError('Erreur récupération sessions', error);
      this.repondreErreur(res, 'Impossible de récupérer les sessions', 500, 'SESSIONS_ERROR');
    }
  });
} 
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
  protected override nomController = 'EleveController';

  // Get student by ID
  getEleve = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);
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

    // Update login status and last access using new instance method
    await eleve.updateLoginStatus(true);

    this.repondreSucces(res, {
      id: eleve.id,
      prenom: eleve.prenom,
      nom: eleve.nom,
      nomComplet: eleve.getFullName(),
      niveauActuel: eleve.niveauActuel,
      niveauNumerique: eleve.getNumericalLevel(),
      age: eleve.age,
      groupeAge: eleve.getAgeGroup(),
      totalPoints: eleve.totalPoints,
      serieJours: eleve.serieJours,
      preferences: eleve.preferences,
      adaptations: eleve.adaptations,
      dernierAcces: eleve.dernierAcces,
      estConnecte: eleve.estConnecte,
      estActif: eleve.isActive(),
      necessiteSupervisionParent: eleve.needsParentSupervision()
    }, 'Données élève récupérées avec succès');
  });

  // Get recommended exercises
  getExercicesRecommandes = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);
    const limite = Math.min(parseInt(req.query['limite'] as string) || 5, 20);

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

      // Use student's age group for better recommendations
      const groupeAge = eleve.getAgeGroup();

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
        adapteGroupeAge: groupeAge, // Add age group adaptation info
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
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);
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
          nombreReussites: reussi ? progression.nombreReussites + 1 : progression.nombreReussites,
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

      // Update student points and daily streak using new instance methods
      if (pointsGagnes > 0) {
        await eleve.addPoints(pointsGagnes);
      }
      await eleve.updateDailyStreak();

      // Invalidate student cache
      await cacheService.invalidateStudentCache(eleveId);

      this.repondreSucces(res, {
        reussi,
        pointsGagnes,
        nouveauTotalPoints: eleve.totalPoints + pointsGagnes,
        serieJours: eleve.serieJours,
        progression: {
          statut: progression.statut,
          nombreTentatives: progression.nombreTentatives,
          nombreReussites: progression.nombreReussites,
          pointsGagnes: progression.pointsGagnes
        }
      }, reussi ? 'Exercice réussi !' : 'Continuez vos efforts !');
    } catch (error) {
      this.logError('Erreur soumission exercice', error);
      this.repondreErreur(res, 'Impossible de soumettre l\'exercice', 500, 'SUBMISSION_ERROR');
    }
  });

  // Get student progress
  getProgression = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);
    const statut = req.query['statut'] as string;
    const matiere = req.query['matiere'] as string;
    const limite = Math.min(parseInt(req.query['limite'] as string) || 50, 100);
    const page = Math.max(parseInt(req.query['page'] as string) || 1, 1);
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
      const includeOptions: any = [{
        model: ExercicePedagogique,
        include: [{
          model: ModulePedagogique
        }]
      }];

      // Add matiere filter if provided
      if (matiere) {
        includeOptions[0].include[0].where = { matiere };
      }

      const { count, rows: progressions } = await ProgressionEleve.findAndCountAll({
        where: whereClause,
        include: includeOptions,
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

  // Get sessions and analytics
  getSessions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);
    const jours = parseInt(req.query['jours'] as string) || 30;

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    try {
      const dateLimite = new Date();
      dateLimite.setDate(dateLimite.getDate() - jours);

      const sessions = await SessionEleve.findAll({
        where: {
          eleveId,
          dateDebut: { [Op.gte]: dateLimite }
        },
        order: [['dateDebut', 'DESC']]
      });

      const analytics = {
        totalSessions: sessions.length,
        totalDuree: sessions.reduce((sum, session) => sum + (session.dureeMinutes || 0), 0),
        moyenneDuree: sessions.length > 0 ? 
          Math.round(sessions.reduce((sum, session) => sum + (session.dureeMinutes || 0), 0) / sessions.length) : 0,
        sessionsParJour: Math.round(sessions.length / jours * 10) / 10,
        derniereSession: sessions[0]?.dateDebut || null
      };

      this.repondreSucces(res, {
        sessions: sessions.map(session => ({
          id: session.id,
          dateDebut: session.dateDebut,
          dateFin: session.dateFin,
          dureeMinutes: session.dureeMinutes,
          exercicesReussis: session.exercicesReussis,
          exercicesTentes: session.exercicesTentes,
          pointsGagnes: session.pointsGagnes
        })),
        analytics
      }, 'Sessions récupérées avec succès');
    } catch (error) {
      this.logError('Erreur récupération sessions', error);
      this.repondreErreur(res, 'Impossible de récupérer les sessions', 500, 'SESSIONS_ERROR');
    }
  });

  // Update student preferences
  updatePreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);
    const { preferences } = req.body;

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    try {
      await eleve.updatePreferences(preferences);
      
      // Invalidate student cache
      await cacheService.invalidateStudentCache(eleveId);

      this.repondreSucces(res, {
        preferences: eleve.preferences
      }, 'Préférences mises à jour avec succès');
    } catch (error) {
      this.logError('Erreur mise à jour préférences', error);
      this.repondreErreur(res, 'Impossible de mettre à jour les préférences', 500, 'PREFERENCES_ERROR');
    }
  });

  // Update student adaptations
  updateAdaptations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);
    const { adaptations } = req.body;

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    try {
      await eleve.updateAdaptations(adaptations);
      
      // Invalidate student cache
      await cacheService.invalidateStudentCache(eleveId);

      this.repondreSucces(res, {
        adaptations: eleve.adaptations
      }, 'Adaptations mises à jour avec succès');
    } catch (error) {
      this.logError('Erreur mise à jour adaptations', error);
      this.repondreErreur(res, 'Impossible de mettre à jour les adaptations', 500, 'ADAPTATIONS_ERROR');
    }
  });

  // Get student statistics
  getStatistiques = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    try {
      // Get progression statistics
      const progressions = await ProgressionEleve.findAll({
        where: { eleveId }
      });

      const statistiques = {
        general: {
          totalPoints: eleve.totalPoints,
          serieJours: eleve.serieJours,
          niveauActuel: eleve.niveauActuel,
          niveauNumerique: eleve.getNumericalLevel(),
          groupeAge: eleve.getAgeGroup(),
          estActif: eleve.isActive(),
          necessiteSupervisionParent: eleve.needsParentSupervision()
        },
        progression: {
          totalExercices: progressions.length,
          exercicesTermines: progressions.filter(p => p.statut === 'TERMINE').length,
          exercicesEnCours: progressions.filter(p => p.statut === 'EN_COURS').length,
          exercicesMaitrises: progressions.filter(p => p.statut === 'MAITRISE').length,
          tauxReussite: progressions.length > 0 ? 
            Math.round((progressions.filter(p => p.statut === 'TERMINE').length / progressions.length) * 100) : 0
        },
        performance: {
          totalTentatives: progressions.reduce((sum, p) => sum + p.nombreTentatives, 0),
          totalReussites: progressions.reduce((sum, p) => sum + p.nombreReussites, 0),
          moyenneTentatives: progressions.length > 0 ? 
            Math.round(progressions.reduce((sum, p) => sum + p.nombreTentatives, 0) / progressions.length * 10) / 10 : 0
        }
      };

      this.repondreSucces(res, statistiques, 'Statistiques récupérées avec succès');
    } catch (error) {
      this.logError('Erreur récupération statistiques', error);
      this.repondreErreur(res, 'Impossible de récupérer les statistiques', 500, 'STATISTICS_ERROR');
    }
  });

  // Update login status
  updateLoginStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    try {
      await eleve.updateLoginStatus(true);
      await eleve.updateDailyStreak();

      this.repondreSucces(res, {
        estConnecte: eleve.estConnecte,
        dernierAcces: eleve.dernierAcces,
        serieJours: eleve.serieJours
      }, 'Connexion enregistrée avec succès');
    } catch (error) {
      this.logError('Erreur mise à jour statut connexion', error);
      this.repondreErreur(res, 'Impossible de mettre à jour le statut de connexion', 500, 'LOGIN_STATUS_ERROR');
    }
  });

  // Update logout status
  updateLogoutStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const eleveIdParam = req.params['id'];
    if (!eleveIdParam) {
      this.repondreErreur(res, 'ID élève requis', 400, 'MISSING_STUDENT_ID');
      return;
    }
    
    const eleveId = parseInt(eleveIdParam);

    if (isNaN(eleveId) || eleveId <= 0) {
      this.repondreErreur(res, 'ID élève invalide', 400, 'INVALID_STUDENT_ID');
      return;
    }

    const eleve = await Eleve.findByPk(eleveId);
    if (!eleve) {
      this.repondreErreur(res, `Élève avec l'ID ${eleveId} non trouvé`, 404, 'STUDENT_NOT_FOUND');
      return;
    }

    try {
      await eleve.updateLoginStatus(false);

      this.repondreSucces(res, {
        estConnecte: eleve.estConnecte,
        dernierAcces: eleve.dernierAcces
      }, 'Déconnexion enregistrée avec succès');
    } catch (error) {
      this.logError('Erreur mise à jour statut déconnexion', error);
      this.repondreErreur(res, 'Impossible de mettre à jour le statut de déconnexion', 500, 'LOGOUT_STATUS_ERROR');
    }
  });
} 
import { generateOwnedQuiz, getOwnedQuiz, listOwnedQuizzes, submitOwnedQuizAttempt } from '../services/quizService.js';

export async function listQuizzesAction(req, res, next) { try { res.json(await listOwnedQuizzes(req.user._id)); } catch (error) { next(error); } }
export async function generateQuizAction(req, res, next) { try { res.status(201).json(await generateOwnedQuiz(req.user._id, req.body)); } catch (error) { next(error); } }
export async function getQuizAction(req, res, next) { try { res.json(await getOwnedQuiz(req.user._id, req.params.id)); } catch (error) { next(error); } }
export async function submitQuizAttemptAction(req, res, next) { try { res.status(201).json(await submitOwnedQuizAttempt(req.user._id, req.params.id, req.body.answers)); } catch (error) { next(error); } }

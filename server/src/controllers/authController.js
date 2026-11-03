import { getRefreshCookieName, getPublicUser, login, logout, refreshSession, register, makeAccessToken } from '../services/authService.js';
const refreshCookie = req => req.cookies[getRefreshCookieName()];

export async function registerAction(req, res, next) {
  try { res.status(201).json(await register(req.body, res)); } catch (error) { next(error); }
}

export async function loginAction(req, res, next) {
  try { res.json(await login(req.body, res)); } catch (error) { next(error); }
}

export async function refreshAction(req, res, next) {
  try { res.json(await refreshSession(refreshCookie(req), res)); } catch (error) { next(error); }
}

export async function logoutAction(req, res, next) {
  try { res.json(await logout(refreshCookie(req), res)); } catch (error) { next(error); }
}

export function meAction(req, res) {
  res.json({ user: getPublicUser(req.user), accessToken: makeAccessToken(req.user) });
}

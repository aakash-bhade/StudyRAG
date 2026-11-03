import { changePassword, getRefreshCookieName, getPublicUser, login, logout, refreshSession, register, makeAccessToken, updateProfile } from '../services/authService.js';
import { exportUserData } from '../services/exportService.js';
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

export async function changePasswordAction(req, res, next) {
  try { res.json(await changePassword(req.user._id, req.body)); } catch (error) { next(error); }
}

export async function updateProfileAction(req, res, next) {
  try { res.json(await updateProfile(req.user._id, req.body)); } catch (error) { next(error); }
}

export async function exportDataAction(req, res, next) {
  try {
    const data = await exportUserData(req.user._id);
    const date = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Disposition', `attachment; filename="studyrag-data-export-${date}.json"`);
    res.setHeader('Cache-Control', 'private, no-store');
    res.json(data);
  } catch (error) { next(error); }
}

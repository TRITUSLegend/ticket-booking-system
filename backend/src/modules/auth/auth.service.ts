import bcrypt from 'bcrypt';
import { prisma } from '../../config';
import { ApiError } from '../../middleware';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../lib/jwt';
import { RegisterInput, LoginInput } from './auth.validation';

export async function register(data: RegisterInput) {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw ApiError.conflict('Email already in use');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash,
    },
  });

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  const { passwordHash: _, refreshTokenHash: __, ...userWithoutSecrets } = user;

  return { user: userWithoutSecrets, accessToken, refreshToken };
}

export async function login(data: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
  if (!isPasswordValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const payload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  const { passwordHash: _, refreshTokenHash: __, ...userWithoutSecrets } = user;

  return { user: userWithoutSecrets, accessToken, refreshToken };
}

export async function refreshTokens(token: string) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.refreshTokenHash) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const isTokenValid = await bcrypt.compare(token, user.refreshTokenHash);
  if (!isTokenValid) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const newPayload = { userId: user.id, email: user.email, role: user.role };
  const accessToken = signAccessToken(newPayload);
  const refreshToken = signRefreshToken(newPayload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshTokenHash },
  });

  return { accessToken, refreshToken };
}

export async function logout(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { refreshTokenHash: null },
  });
}

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "姓名至少 2 个字符"),
  email: z.email("请输入有效邮箱").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "密码至少 8 位")
    .regex(/[A-Za-z]/, "密码需包含字母")
    .regex(/[0-9]/, "密码需包含数字"),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, "请输入密码"),
});

export const preferenceSchema = z.object({
  favoriteCompetition: z.string().trim().max(40).optional(),
  favoritePlayer: z.string().trim().max(40).optional(),
  language: z.string().trim().default("zh-CN"),
  receiveNewsletter: z.boolean().default(true),
});

export const favoriteSchema = z.object({
  entityType: z.enum(["news", "match", "product"]),
  entityId: z.string().trim().min(1),
});

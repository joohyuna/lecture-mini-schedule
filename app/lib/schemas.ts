import { z } from "zod";
import { CATEGORIES, MAX_TEXT_LENGTH } from "./types";

// 클라이언트 폼과 서버 API(route handler)에서 같은 규칙을 공유하기 위한 단일 소스.

export const loginSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다."),
  password: z.string().min(1, "비밀번호를 입력하세요."),
});

const nicknameSchema = z
  .string()
  .trim()
  .min(2, "닉네임은 2자 이상이어야 합니다.")
  .max(20, "닉네임은 20자 이하여야 합니다.");

const passwordSchema = z
  .string()
  .min(6, "비밀번호는 6자 이상이어야 합니다.")
  .max(72, "비밀번호는 72자 이하여야 합니다."); // bcrypt 72바이트 경계

export const registerSchema = z.object({
  email: z.email("올바른 이메일 형식이 아닙니다."),
  nickname: nicknameSchema,
  password: passwordSchema,
});

export const updateNicknameSchema = z.object({
  nickname: nicknameSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력하세요."),
  newPassword: passwordSchema,
});

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식은 YYYY-MM-DD 여야 합니다.");

const diaryItemSchema = z.object({
  id: z.string().min(1),
  date: dateStringSchema,
  category: z.enum(CATEGORIES as [string, ...string[]]),
  text: z.string().trim().min(1).max(MAX_TEXT_LENGTH),
  status: z.enum(["open", "done", "broken"]),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const itemsPayloadSchema = z.object({
  items: z.array(diaryItemSchema),
});

const dayFeedbackSchema = z.object({
  date: dateStringSchema,
  text: z.string(),
  updatedAt: z.number(),
});

export const feedbackPayloadSchema = z.object({
  feedback: z.record(dateStringSchema, dayFeedbackSchema),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

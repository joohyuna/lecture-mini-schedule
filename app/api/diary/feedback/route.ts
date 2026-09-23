import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { feedbackPayloadSchema } from "@/app/lib/schemas";
import type { DayFeedback } from "@/app/lib/types";

// GET /api/diary/feedback — 로그인한 사용자의 날짜별 피드백
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rows = await prisma.dayFeedback.findMany({
    where: { userId: session.user.id },
    select: { date: true, text: true, updatedAt: true },
  });

  const feedback: Record<string, DayFeedback> = {};
  for (const row of rows) {
    feedback[row.date] = row;
  }

  return NextResponse.json({ feedback });
}

// PUT /api/diary/feedback  { feedback }  — 로그인한 사용자의 전체 피드백을 통째로 교체
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = feedbackPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const rows = Object.values(parsed.data.feedback).map((f) => ({
    id: `${userId}:${f.date}`,
    userId,
    date: f.date,
    text: f.text,
    updatedAt: f.updatedAt,
  }));

  // createMany는 빈 배열을 받으면 MongoDB 커넥터가 에러를 던진다(피드백이
  // 하나도 없는 저장도 정상 케이스라 빈 배열일 땐 deleteMany만 실행한다).
  if (rows.length === 0) {
    await prisma.dayFeedback.deleteMany({ where: { userId } });
  } else {
    await prisma.$transaction([
      prisma.dayFeedback.deleteMany({ where: { userId } }),
      prisma.dayFeedback.createMany({ data: rows }),
    ]);
  }

  return NextResponse.json({ ok: true });
}

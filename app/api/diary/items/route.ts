import { NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";
import { itemsPayloadSchema } from "@/app/lib/schemas";

// GET /api/diary/items — 로그인한 사용자의 전체 항목
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rows = await prisma.diaryItem.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      date: true,
      category: true,
      text: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ items: rows });
}

// PUT /api/diary/items  { items }  — 로그인한 사용자의 전체 항목을 통째로 교체
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

  const parsed = itemsPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "VALIDATION", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const userId = session.user.id;
  const items = parsed.data.items;
  // createMany는 빈 배열을 받으면 MongoDB 커넥터가 에러를 던진다(새 계정처럼
  // 항목이 0개인 저장도 정상 케이스라 빈 배열일 땐 deleteMany만 실행한다).
  if (items.length === 0) {
    await prisma.diaryItem.deleteMany({ where: { userId } });
  } else {
    await prisma.$transaction([
      prisma.diaryItem.deleteMany({ where: { userId } }),
      prisma.diaryItem.createMany({
        data: items.map((it) => ({ ...it, userId })),
      }),
    ]);
  }

  return NextResponse.json({ ok: true });
}

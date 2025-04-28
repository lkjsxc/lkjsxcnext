// src/app/api/test-prisma/route.ts
import { PrismaClient } from "@/generated/prisma"; // または '@/generated/prisma' など適切なパス
import { NextResponse } from 'next/server';

// route.ts と同じようにインスタンス化
const prisma = new PrismaClient();

export async function GET() {
  try {
    // 実際に存在するモデル名 (例: User) を使う
    const userCount = await prisma.accountUser.count();
    console.log('Prisma test successful, user count:', userCount);
    return NextResponse.json({ success: true, count: userCount });
  } catch (error: any) {
    console.error("Prisma Test Error:", error);
    // エラーの詳細を返す
    return NextResponse.json({ success: false, error: error.message, stack: error.stack }, { status: 500 });
  }
}
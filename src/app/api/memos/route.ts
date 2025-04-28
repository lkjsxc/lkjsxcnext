import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route"; // Assuming authOptions are exported from your NextAuth route file

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const memos = await prisma.memo.findMany({
      where: {
        authorId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(memos);
  } catch (error) {
    console.error("Error fetching memos:", error);
    return NextResponse.json({ message: "Error fetching memos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, content } = await request.json();
    const newMemo = await prisma.memo.create({
      data: {
        title,
        content,
        authorId: session.user.id,
      },
    });
    return NextResponse.json(newMemo, { status: 201 });
  } catch (error) {
    console.error("Error creating memo:", error);
    return NextResponse.json({ message: "Error creating memo" }, { status: 500 });
  }
}
import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route"; // Assuming authOptions are exported from your NextAuth route file

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get('scope'); // 'public' or 'private'

  if (scope === 'private' && (!session || !session.user)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const whereClause: any = {};

    if (scope === 'private' && session?.user?.id) {
      whereClause.authorId = session.user.id;
    } else { // Default to public if scope is not private or user is not authenticated
      whereClause.isPublic = true;
    }

    const memos = await prisma.memo.findMany({
      where: whereClause,
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
    const { title, content, isPublic } = await request.json();
    const newMemo = await prisma.memo.create({
      data: {
        title,
        content,
        isPublic: isPublic ?? false, // Default to false if not provided
        authorId: session.user.id,
      },
    });
    return NextResponse.json(newMemo, { status: 201 });
  } catch (error) {
    console.error("Error creating memo:", error);
    return NextResponse.json({ message: "Error creating memo" }, { status: 500 });
  }
}
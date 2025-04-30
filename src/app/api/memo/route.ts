import { ExtendedSession } from "@/types";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Memo } from "@/types";

// GET /api/memo
// Fetches a list of memos based on scope (public, private, all)
export async function GET(request: Request) {
  const session: ExtendedSession | null = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") || "public"; // Default to public

  let memos: Memo[] = [];

  try {
    if (scope === "private" || scope === "all") {
      if (!session || !session.user?.id) {
        return NextResponse.json({ error: "Authentication required for private or all scope" }, { status: 401 });
      }
    }

    if (scope === "public") {
      memos = await prisma.memo.findMany({
        where: { isPublic: true },
        orderBy: { updatedAt: "desc" },
      });
    } else if (scope === "private") {
      memos = await prisma.memo.findMany({
        where: { authorId: session?.user?.id },
        orderBy: { updatedAt: "desc" },
      });
    } else if (scope === "all") {
      memos = await prisma.memo.findMany({
        where: {
          OR: [
            { isPublic: true },
            { authorId: session?.user?.id },
          ],
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      return NextResponse.json({ error: "Invalid scope parameter" }, { status: 400 });
    }

    return NextResponse.json(memos);

  } catch (error) {
    console.error("Error fetching memos:", error);
    return NextResponse.json({ error: "Failed to fetch memos" }, { status: 500 });
  }
}

// POST /api/memo
// Creates a new memo
export async function POST(request: Request) {
  const session: ExtendedSession | null = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { title, content, isPublic } = await request.json();

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const newMemo = await prisma.memo.create({
      data: {
        title,
        content,
        isPublic: isPublic ?? false, // Default to private if not specified
        authorId: session.user.id,
      },
    });

    return NextResponse.json(newMemo, { status: 201 });

  } catch (error) {
    console.error("Error creating memo:", error);
    return NextResponse.json({ error: "Failed to create memo" }, { status: 500 });
  }
}
// src/app/api/memo/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  try {
    let memos;
    if (scope === "private" && session?.user?.id) {
      // Fetch only private memos for the authenticated user
      memos = await prisma.memo.findMany({
        where: {
          authorId: session.user.id,
          isPublic: false,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } else if (scope === "all" && session?.user?.id) {
      // Fetch public memos + private memos for the authenticated user
      memos = await prisma.memo.findMany({
        where: {
          OR: [
            { isPublic: true },
            { authorId: session.user.id, isPublic: false },
          ],
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } else {
      // Default: Fetch only public memos
      memos = await prisma.memo.findMany({
        where: {
          isPublic: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }

    return NextResponse.json(memos);
  } catch (error) {
    console.error("Error fetching memos:", error);
    return NextResponse.json({ message: "Error fetching memos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { title, content, isPublic } = await request.json();

    if (!title) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const newMemo = await prisma.memo.create({
      data: {
        title,
        content,
        isPublic: isPublic ?? false, // Default to false if not provided
        authorId: session.user.id,
        clientUpdatedAt: new Date(), // Set initial clientUpdatedAt
      },
    });

    return NextResponse.json(newMemo, { status: 201 });
  } catch (error) {
    console.error("Error creating memo:", error);
    return NextResponse.json({ message: "Error creating memo" }, { status: 500 });
  }
}
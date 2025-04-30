// src/app/api/memo/[id]/route.ts
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/memo/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const memoId = params.id;

  try {
    const memo = await prisma.memo.findUnique({
      where: { id: memoId },
      include: { author: true }, // Include author to check ownership
    });

    if (!memo) {
      return NextResponse.json({ message: "Memo not found" }, { status: 404 });
    }

    // Determine if the current user is the owner
    const isOwner = session?.user?.id === memo.authorId;

    // If memo is private and user is not the owner, deny access
    if (!memo.isPublic && !isOwner) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Return memo data along with ownership status
    return NextResponse.json({ ...memo, isOwner });

  } catch (error) {
    console.error(`Error fetching memo ${memoId}:`, error);
    return NextResponse.json({ message: "Error fetching memo" }, { status: 500 });
  }
}

// PUT /api/memo/[id]
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const memoId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    const { title, content, isPublic, clientUpdatedAt } = await request.json();

    // Find the memo and check ownership
    const existingMemo = await prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!existingMemo) {
      return NextResponse.json({ message: "Memo not found" }, { status: 404 });
    }

    if (existingMemo.authorId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Optimistic Concurrency Control check
    // Compare the client's timestamp with the server's last known client timestamp
    if (clientUpdatedAt) {
      const serverClientUpdatedAt = existingMemo.clientUpdatedAt;
      const clientTimestamp = new Date(clientUpdatedAt);

      // If the server's timestamp is newer than the client's, there's a conflict
      if (serverClientUpdatedAt && serverClientUpdatedAt > clientTimestamp) {
        console.warn(`Conflict detected for memo ${memoId}. Server timestamp: ${serverClientUpdatedAt.toISOString()}, Client timestamp: ${clientTimestamp.toISOString()}`);
        return NextResponse.json({ message: "Conflict: Memo has been updated by someone else." }, { status: 409 });
      }
    }

    // Update the memo
    const updatedMemo = await prisma.memo.update({
      where: { id: memoId },
      data: {
        title: title ?? existingMemo.title,
        content: content ?? existingMemo.content,
        isPublic: isPublic ?? existingMemo.isPublic,
        clientUpdatedAt: new Date(), // Update server's client timestamp on successful write
      },
    });

    return NextResponse.json(updatedMemo);

  } catch (error) {
    console.error(`Error updating memo ${memoId}:`, error);
    return NextResponse.json({ message: "Error updating memo" }, { status: 500 });
  }
}

// DELETE /api/memo/[id]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const memoId = params.id;

  if (!session?.user?.id) {
    return NextResponse.json({ message: "Authentication required" }, { status: 401 });
  }

  try {
    // Find the memo and check ownership
    const existingMemo = await prisma.memo.findUnique({
      where: { id: memoId },
    });

    if (!existingMemo) {
      return NextResponse.json({ message: "Memo not found" }, { status: 404 });
    }

    if (existingMemo.authorId !== session.user.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Delete the memo
    await prisma.memo.delete({
      where: { id: memoId },
    });

    return NextResponse.json({ message: "Memo deleted successfully" });

  } catch (error) {
    console.error(`Error deleting memo ${memoId}:`, error);
    return NextResponse.json({ message: "Error deleting memo" }, { status: 500 });
  }
}
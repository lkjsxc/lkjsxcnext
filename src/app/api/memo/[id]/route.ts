import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ExtendedSession, MemoWithOwnership } from "@/types";

// GET /api/memo/[id]
// Fetches a specific memo by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session: ExtendedSession | null = await getServerSession(authOptions);
  const { id } = params;

  try {
    const memo = await prisma.memo.findUnique({
      where: { id },
      include: { author: true }, // Include author to check ownership
    });

    if (!memo) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    // Determine if the current user is the owner
    const isOwner = session?.user?.id === memo.authorId;

    // If the memo is private and the user is not the owner, deny access
    if (!memo.isPublic && !isOwner) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Return memo details along with ownership status
    const memoWithOwnership: MemoWithOwnership = {
      ...memo,
      isOwner,
    };

    return NextResponse.json(memoWithOwnership);

  } catch (error) {
    console.error(`Error fetching memo ${id}:`, error);
    return NextResponse.json({ error: "Failed to fetch memo" }, { status: 500 });
  }
}

// PUT /api/memo/[id]
// Updates a specific memo (requires auth & ownership)
// Implements Optimistic Concurrency Control (OCC)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session: ExtendedSession | null = await getServerSession(authOptions);
  const { id } = params;

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { title, content, isPublic, clientUpdatedAt } = await request.json();

    // Fetch the current memo to check ownership and timestamp
    const existingMemo = await prisma.memo.findUnique({
      where: { id },
    });

    if (!existingMemo) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    // Check if the user is the owner
    if (existingMemo.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Optimistic Concurrency Control check
    // Compare client's timestamp with the server's last updated timestamp
    if (clientUpdatedAt) {
      const serverUpdatedAt = existingMemo.clientUpdatedAt.toISOString();
      if (new Date(clientUpdatedAt) < new Date(serverUpdatedAt)) {
        // Conflict: Server has a newer version
        return NextResponse.json({ error: "Conflict: Memo has been updated by another process." }, { status: 409 });
      }
    }

    // Update the memo
    const updatedMemo = await prisma.memo.update({
      where: { id },
      data: {
        title: title ?? existingMemo.title,
        content: content ?? existingMemo.content,
        isPublic: isPublic ?? existingMemo.isPublic,
        clientUpdatedAt: new Date(), // Update server-side timestamp on successful write
      },
    });

    return NextResponse.json(updatedMemo);

  } catch (error) {
    console.error(`Error updating memo ${id}:`, error);
    return NextResponse.json({ error: "Failed to update memo" }, { status: 500 });
  }
}

// DELETE /api/memo/[id]
// Deletes a specific memo (requires auth & ownership)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session: ExtendedSession | null = await getServerSession(authOptions);
  const { id } = params;

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Fetch the current memo to check ownership
    const existingMemo = await prisma.memo.findUnique({
      where: { id },
    });

    if (!existingMemo) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 });
    }

    // Check if the user is the owner
    if (existingMemo.authorId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the memo
    await prisma.memo.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Memo deleted successfully" });

  } catch (error) {
    console.error(`Error deleting memo ${id}:`, error);
    return NextResponse.json({ error: "Failed to delete memo" }, { status: 500 });
  }
}
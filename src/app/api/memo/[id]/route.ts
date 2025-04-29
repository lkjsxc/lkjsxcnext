import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  const memo = await prisma.memo.findUnique({
    where: {
      id: id,
    },
  });

  if (!memo) {
    return NextResponse.json({ message: "Memo not found" }, { status: 404 });
  }

  const isOwner = session?.user?.id === memo.authorId;

  return NextResponse.json({ ...memo, isOwner });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { title, content, isPublic, clientUpdatedAt } = await request.json();

  // Fetch the current memo to compare timestamps
  const existingMemo = await prisma.memo.findUnique({
    where: {
      id: id,
      authorId: session.user.id, // Ensure the user owns the memo
    },
    select: {
      clientUpdatedAt: true,
    },
  });

  // If the existing memo has a newer clientUpdatedAt, reject the update
  if (existingMemo?.clientUpdatedAt && clientUpdatedAt < existingMemo.clientUpdatedAt.getTime()) {
    console.log(`Rejected update for memo ${id}: incoming timestamp ${clientUpdatedAt} is older than existing ${existingMemo.clientUpdatedAt.getTime()}`);
    return NextResponse.json({ message: "Conflict: Older update rejected" }, { status: 409 });
  }

  const updatedMemo = await prisma.memo.update({
    where: {
      id: id,
      authorId: session.user.id, // Ensure the user owns the memo
    },
    data: {
      title,
      content,
      isPublic, // Include isPublic in the update data
      clientUpdatedAt: clientUpdatedAt ? new Date(clientUpdatedAt) : undefined, // Store the client timestamp if provided
    },
  });

  return NextResponse.json(updatedMemo);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

    await prisma.memo.delete({
      where: {
        id: id,
        authorId: session.user.id, // Ensure the user owns the memo
      },
    });
 
    return NextResponse.json({ message: "Memo deleted successfully" });
}
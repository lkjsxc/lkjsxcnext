import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import { broadcastMessage } from "@/lib/websocketServer";

const prisma = new PrismaClient();

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

    const memo = await prisma.memo.findUnique({
      where: {
        id: id,
      },
    });

    if (!memo) {
      return NextResponse.json({ message: "Memo not found" }, { status: 404 });
    }

    return NextResponse.json(memo);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { title, content, isPublic } = await request.json();

    const updatedMemo = await prisma.memo.update({
      where: {
        id: id,
        authorId: session.user.id, // Ensure the user owns the memo
      },
      data: {
        title,
        content,
        isPublic, // Include isPublic in the update data
      },
    });

    // Broadcast the updated memo to all connected WebSocket clients
    // Broadcast the updated memo to all connected Socket.io clients
    // Broadcast the updated memo to all connected WebSocket clients
    broadcastMessage(JSON.stringify({ type: 'memo_updated', payload: updatedMemo }));
 
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

    // Broadcast the deleted memo ID to all connected WebSocket clients
    // Broadcast the deleted memo ID to all connected Socket.io clients
    // Broadcast the deleted memo ID to all connected WebSocket clients
    broadcastMessage(JSON.stringify({ type: 'memo_deleted', payload: { id } }));
 
    return NextResponse.json({ message: "Memo deleted successfully" });
}
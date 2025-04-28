import { getServerSession } from "next-auth/next";
import { PrismaClient } from "@/generated/prisma";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { title, content, isPublic } = await request.json();

  try {
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
    return NextResponse.json(updatedMemo);
  } catch (error) {
    console.error("Error updating memo:", error);
    return NextResponse.json({ message: "Error updating memo" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    await prisma.memo.delete({
      where: {
        id: id,
        authorId: session.user.id, // Ensure the user owns the memo
      },
    });
    return NextResponse.json({ message: "Memo deleted successfully" });
  } catch (error) {
    console.error("Error deleting memo:", error);
    return NextResponse.json({ message: "Error deleting memo" }, { status: 500 });
  }
}
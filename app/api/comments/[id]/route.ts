import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {

    const { id } = params;
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content
      }
    });

    return NextResponse.json(updatedComment);

  } catch (error) {

    console.error("UPDATE COMMENT ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {

    const { id } = params;

    await prisma.comment.delete({
      where: { id }
    });

    return NextResponse.json({
      message: "Comment deleted"
    });

  } catch (error) {

    console.error("DELETE COMMENT ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
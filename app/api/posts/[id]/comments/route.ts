import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const { content, authorId } = body;

    if (!content || !authorId) {
      return NextResponse.json(
        { error: "Content and authorId required" },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content,

        author: {
          connect: { id: authorId },
        },

        post: {
          connect: { id: id },
        },
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(comment);

  } catch (error) {
    console.error("COMMENT ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    const { id } = await params;   // ⭐ FIX QUAN TRỌNG

    if (!id) {
      return NextResponse.json(
        { error: "Post id is required" },
        { status: 400 }
      );
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId: id
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(comments);

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

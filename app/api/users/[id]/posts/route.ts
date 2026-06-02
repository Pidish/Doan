import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Lấy viewer từ token
    const authResult = verifyAccessToken(request)
    const viewerId = authResult.success ? authResult.payload.id : null

    // Nếu xem chính mình → luôn thấy hết
    const isOwnProfile = viewerId === id

    // Kiểm tra follow (chỉ khi xem người khác)
    let isFollowing = false
    if (!isOwnProfile && viewerId) {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: id } }
      })
      isFollowing = !!follow
    }

    const posts = await prisma.post.findMany({
      where: {
        authorId: id,
        status: 'ACTIVE',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            reposts: true,
          },
        },
        ...(viewerId ? { likes: { where: { userId: viewerId }, select: { userId: true } } } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const data = posts.map(p => {
      const { likes, ...rest } = p as typeof p & { likes?: { userId: string }[] }
      return { ...rest, isLiked: viewerId ? (likes?.length ?? 0) > 0 : false }
    })

    // Chưa follow và không phải trang cá nhân → trả về locked + preview bài đầu tiên
    if (!isOwnProfile && !isFollowing) {
      return NextResponse.json({
        locked: true,
        totalCount: data.length,
        // Preview: chỉ bài đầu tiên (nếu có), nội dung bị cắt ngắn
        preview: data.slice(0, 1).map(p => ({
          ...p,
          content: p.content.slice(0, 80) + (p.content.length > 80 ? '…' : ''),
          imageUrl: undefined, // ẩn ảnh trong preview
        })),
      })
    }

    return NextResponse.json({ data, locked: false });
  } catch (error) {
    console.error("GET USER POSTS ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
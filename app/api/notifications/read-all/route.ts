import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"

// PATCH /api/notifications/read-all
// Đánh dấu tất cả thông báo là đã đọc
export async function PATCH(req: NextRequest) {
  try {
    const result = verifyAccessToken(req)
    if (!result.success) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = result.payload.id

    const { count } = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    })

    return NextResponse.json({ message: `Marked ${count} notifications as read` })

  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
```

---

## Cấu trúc folder
```
app/api/notifications/
  route.ts              ← GET tất cả thông báo
  read-all/route.ts     ← PATCH đánh dấu tất cả đã đọc
  [id]/route.ts         ← PATCH đọc 1 / DELETE xóa 1
```

---

## Test trong Postman

**GET tất cả:**
```
GET http://localhost:3000/api/notifications
Authorization: Bearer {{access_token}}
```

**GET chỉ chưa đọc:**
```
GET http://localhost:3000/api/notifications?unread=true
```

**Đánh dấu đã đọc 1 cái:**
```
PATCH http://localhost:3000/api/notifications/<id>
Authorization: Bearer {{access_token}}
```

**Đánh dấu tất cả đã đọc:**
```
PATCH http://localhost:3000/api/notifications/read-all
Authorization: Bearer {{access_token}}
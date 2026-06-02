import Groq from 'groq-sdk'

let _client: Groq | null = null
function getClient() {
  if (!_client) _client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  return _client
}

export type PostCategory = 'TINH_LANG' | 'SONG_XANH' | 'SANG_TAO' | 'TAM_LY_HOC' | 'DANH_CHO_BAN'

export interface ModerationResult {
  result: 'SAFE' | 'WARNING' | 'BLOCKED'
  reason: string
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  category: PostCategory
}

const VALID_CATEGORIES: PostCategory[] = ['TINH_LANG', 'SONG_XANH', 'SANG_TAO', 'TAM_LY_HOC', 'DANH_CHO_BAN']

const SYSTEM_PROMPT = `Bạn là hệ thống kiểm duyệt và phân loại nội dung cho mạng xã hội Nexora — cộng đồng tích cực hướng đến sức khỏe tinh thần và thiên nhiên.

Phân tích bài đăng và trả về JSON với 4 trường:
- "result": "SAFE" | "WARNING" | "BLOCKED"
- "reason": lý do ngắn gọn tiếng Việt (tối đa 100 ký tự)
- "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL"
- "category": một trong các chủ đề sau:
    "TINH_LANG"   — Thiền định, bình yên, mindfulness, hơi thở, nội tâm
    "SONG_XANH"   — Thiên nhiên, cây cối, môi trường, sống xanh, tái chế
    "SANG_TAO"    — Nghệ thuật, thiết kế, lập trình, sáng tạo, code, UI/UX
    "TAM_LY_HOC"  — Tâm lý, cảm xúc, stress, động lực, phát triển bản thân
    "DANH_CHO_BAN" — Tất cả nội dung không thuộc 4 chủ đề trên

Quy tắc kiểm duyệt:
BLOCKED — ngôn từ thù ghét, bạo lực, khiêu dâm, spam, lừa đảo, dox
WARNING — tiêu cực nhẹ, nhạy cảm (chính trị, tranh cãi), thông tin chưa kiểm chứng
SAFE    — nội dung bình thường, tích cực, hoặc trung lập

Chỉ trả về JSON thuần túy, không giải thích thêm.
Ví dụ: {"result":"SAFE","reason":"Nội dung tích cực","sentiment":"POSITIVE","category":"TINH_LANG"}`

export async function moderateContent(content: string): Promise<ModerationResult> {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return { result: 'SAFE', reason: 'AI chưa được cấu hình', sentiment: 'NEUTRAL', category: 'DANH_CHO_BAN' }
  }
  console.log('GROQ KEY EXISTS:', !!process.env.GROQ_API_KEY)
console.log('GROQ KEY START:', process.env.GROQ_API_KEY?.slice(0, 4))
  try {
    const completion = await getClient().chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Nội dung cần phân tích:\n"${content}"` },
      ],
      max_tokens: 150,
      response_format: { type: 'json_object' },
    })

    const text = completion.choices[0]?.message?.content?.trim() || ''
    const parsed = JSON.parse(text) as ModerationResult

    if (!['SAFE', 'WARNING', 'BLOCKED'].includes(parsed.result)) parsed.result = 'SAFE'
    if (!['POSITIVE', 'NEGATIVE', 'NEUTRAL'].includes(parsed.sentiment)) parsed.sentiment = 'NEUTRAL'
    if (!VALID_CATEGORIES.includes(parsed.category)) parsed.category = 'DANH_CHO_BAN'
    if (!parsed.reason) parsed.reason = 'Kiểm duyệt tự động'

    return parsed
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('401') || msg.includes('invalid_api_key')) {
      console.warn('Moderation skipped: Invalid Groq API key')
      return { result: 'SAFE', reason: 'API key không hợp lệ', sentiment: 'NEUTRAL', category: 'DANH_CHO_BAN' }
    }
    console.error('Moderation error:', err)
    return { result: 'SAFE', reason: 'Bỏ qua kiểm duyệt (lỗi AI)', sentiment: 'NEUTRAL', category: 'DANH_CHO_BAN' }
  }
}

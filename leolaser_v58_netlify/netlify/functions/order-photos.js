// LEOLASER 갤러리 사진 순서 저장 처리기 (Netlify Function)
// 각 사진에 순서 번호(leo_order)를 Cloudinary context 메타데이터로 박음
// → 삭제 기능(delete-photo)과 동일한 검증된 API 패턴 사용
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'bad request' }) };
  }

  const order = data.order;   // [public_id, public_id, ...] 순서대로
  const pw = data.pw;

  const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
  const KEY = process.env.CLOUDINARY_API_KEY;
  const SECRET = process.env.CLOUDINARY_API_SECRET;
  const ADMIN_PW = process.env.GALLERY_PASSWORD;

  if (!ADMIN_PW || pw !== ADMIN_PW) {
    return { statusCode: 403, body: JSON.stringify({ ok: false, error: '권한 없음' }) };
  }
  if (!Array.isArray(order) || order.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: '순서 목록 없음' }) };
  }
  if (!CLOUD || !KEY || !SECRET) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '서버 설정 누락' }) };
  }

  // 각 사진에 context(leo_order=0001 ...) 한 장씩 저장
  // delete-photo와 동일하게 URLSearchParams + sha1 서명 사용
  const errors = [];
  for (let i = 0; i < order.length; i++) {
    const publicId = order[i];
    if (!publicId) continue;
    const orderVal = String(i + 1).padStart(4, '0');
    const contextStr = 'leo_order=' + orderVal;

    const timestamp = Math.floor(Date.now() / 1000);
    // 서명 대상 (알파벳순): command, context, public_ids, timestamp
    // ※ 전송 필드명도 public_ids 로 통일 (대괄호 쓰면 서명 불일치 발생)
    const toSign = `command=add&context=${contextStr}&public_ids=${publicId}&timestamp=${timestamp}${SECRET}`;
    const signature = crypto.createHash('sha1').update(toSign).digest('hex');

    const form = new URLSearchParams();
    form.append('command', 'add');
    form.append('context', contextStr);
    form.append('public_ids', publicId);
    form.append('timestamp', String(timestamp));
    form.append('api_key', KEY);
    form.append('signature', signature);

    try {
      const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/context`, {
        method: 'POST',
        body: form
      });
      const result = await resp.json();
      const ok = result && (Array.isArray(result.public_ids) ? result.public_ids.length > 0 : !!result.public_ids);
      if (!ok) {
        errors.push(publicId + ': ' + ((result && result.error && result.error.message) || JSON.stringify(result)));
      }
    } catch (e) {
      errors.push(publicId + ': ' + e.message);
    }
  }

  if (errors.length) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: errors.join(' | ') }) };
  }
  return { statusCode: 200, body: JSON.stringify({ ok: true, count: order.length }) };
};

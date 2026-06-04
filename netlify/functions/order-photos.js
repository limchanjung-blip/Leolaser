// LEOLASER 갤러리 사진 순서 저장 처리기 (Netlify Function)
// 순서 목록을 Cloudinary raw 파일(leo_gallery_order)에 통째로 저장
// 비밀키는 Netlify 환경변수에만 저장됨 (브라우저에 노출 안 됨)
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
  if (!Array.isArray(order)) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: '순서 목록 없음' }) };
  }
  if (!CLOUD || !KEY || !SECRET) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '서버 설정 누락' }) };
  }

  // 순서 목록을 JSON 문자열로 만들어 raw 파일로 업로드 (덮어쓰기)
  const PUBLIC_ID = 'leo_gallery_order';
  const content = JSON.stringify(order);
  // data URI 형태로 raw 업로드
  const fileData = 'data:application/json;base64,' + Buffer.from(content, 'utf8').toString('base64');

  const timestamp = Math.floor(Date.now() / 1000);
  // 서명 대상: invalidate, overwrite, public_id, timestamp (알파벳순)
  const toSign = `invalidate=true&overwrite=true&public_id=${PUBLIC_ID}&timestamp=${timestamp}${SECRET}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  const form = new URLSearchParams();
  form.append('file', fileData);
  form.append('public_id', PUBLIC_ID);
  form.append('overwrite', 'true');
  form.append('invalidate', 'true');
  form.append('timestamp', String(timestamp));
  form.append('api_key', KEY);
  form.append('signature', signature);

  try {
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/raw/upload`, {
      method: 'POST',
      body: form
    });
    const result = await resp.json();
    if (result && result.secure_url) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, count: order.length }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: (result && result.error && result.error.message) || '순서 저장 실패' }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '클라우드 연결 실패' }) };
  }
};

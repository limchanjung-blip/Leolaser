// LEOLASER 갤러리 사진 완전 삭제 처리기 (Netlify Function)
// 비밀키는 Netlify 환경변수에만 저장됨 (브라우저에 노출 안 됨)
const crypto = require('crypto');

exports.handler = async (event) => {
  // POST만 허용
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ ok: false, error: 'method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'bad request' }) };
  }

  const publicId = data.public_id;
  const pw = data.pw;

  // 환경변수에서 값 읽기
  const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
  const KEY = process.env.CLOUDINARY_API_KEY;
  const SECRET = process.env.CLOUDINARY_API_SECRET;
  const ADMIN_PW = process.env.GALLERY_PASSWORD;

  // 비밀번호 확인 (관리자만 삭제 가능)
  if (!ADMIN_PW || pw !== ADMIN_PW) {
    return { statusCode: 403, body: JSON.stringify({ ok: false, error: '권한 없음' }) };
  }
  if (!publicId) {
    return { statusCode: 400, body: JSON.stringify({ ok: false, error: 'public_id 없음' }) };
  }
  if (!CLOUD || !KEY || !SECRET) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '서버 설정 누락' }) };
  }

  // Cloudinary 삭제(destroy) 호출 - 서명 생성
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `public_id=${publicId}&timestamp=${timestamp}${SECRET}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  const form = new URLSearchParams();
  form.append('public_id', publicId);
  form.append('timestamp', String(timestamp));
  form.append('api_key', KEY);
  form.append('signature', signature);

  try {
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
      method: 'POST',
      body: form
    });
    const result = await resp.json();
    if (result.result === 'ok' || result.result === 'not found') {
      return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: result.result || '삭제 실패' }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '클라우드 연결 실패' }) };
  }
};

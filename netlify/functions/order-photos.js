// LEOLASER 갤러리 사진 순서 저장 처리기 (Netlify Function)
// 순서 목록을 Cloudinary raw 파일(leo_gallery_order.json)로 저장
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

  const order = data.order;
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

  const PUBLIC_ID = 'leo_gallery_order';
  const content = JSON.stringify(order);
  const timestamp = Math.floor(Date.now() / 1000);

  // 서명 대상 파라미터 (file, api_key, signature 제외 / 알파벳순)
  // overwrite, public_id, timestamp
  const toSign = `overwrite=true&public_id=${PUBLIC_ID}&timestamp=${timestamp}${SECRET}`;
  const signature = crypto.createHash('sha1').update(toSign).digest('hex');

  // multipart/form-data 로 전송 (raw 업로드는 file 필드 필요)
  const boundary = '----leoFormBoundary' + Date.now();
  const parts = [];
  const addField = (name, value) => {
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="${name}"\r\n\r\n`);
    parts.push(`${value}\r\n`);
  };
  // file 필드: 파일 내용 직접 첨부
  parts.push(`--${boundary}\r\n`);
  parts.push(`Content-Disposition: form-data; name="file"; filename="leo_gallery_order.json"\r\n`);
  parts.push(`Content-Type: application/json\r\n\r\n`);
  parts.push(`${content}\r\n`);

  addField('public_id', PUBLIC_ID);
  addField('overwrite', 'true');
  addField('timestamp', String(timestamp));
  addField('api_key', KEY);
  addField('signature', signature);
  parts.push(`--${boundary}--\r\n`);

  const bodyBuf = Buffer.from(parts.join(''), 'utf8');

  try {
    const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/raw/upload`, {
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
      body: bodyBuf
    });
    const result = await resp.json();
    if (result && result.secure_url) {
      return { statusCode: 200, body: JSON.stringify({ ok: true, count: order.length, url: result.secure_url }) };
    }
    return { statusCode: 200, body: JSON.stringify({ ok: false, error: (result && result.error && result.error.message) || JSON.stringify(result) }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '클라우드 연결 실패: ' + e.message }) };
  }
};

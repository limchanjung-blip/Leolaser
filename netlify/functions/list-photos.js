// LEOLASER 갤러리 사진 목록 불러오기 (Netlify Function)
// Cloudinary Admin API로 태그별 사진 + context(leo_order) 를 가져와
// 순서대로 정렬해서 반환. (공개 list.json은 context를 안 주기 때문에 서버에서 처리)
exports.handler = async (event) => {
  const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
  const KEY = process.env.CLOUDINARY_API_KEY;
  const SECRET = process.env.CLOUDINARY_API_SECRET;
  const TAG = 'leogallery';

  if (!CLOUD || !KEY || !SECRET) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '서버 설정 누락' }) };
  }

  const auth = 'Basic ' + Buffer.from(KEY + ':' + SECRET).toString('base64');
  const url = `https://api.cloudinary.com/v1_1/${CLOUD}/resources/image/tags/${TAG}?context=true&max_results=200`;

  try {
    const resp = await fetch(url, { headers: { Authorization: auth } });
    const result = await resp.json();
    const resources = (result && result.resources) ? result.resources : [];

    const photos = resources.map(r => {
      let ord = 9999;
      if (r.context && r.context.custom && r.context.custom.leo_order) {
        const n = parseInt(r.context.custom.leo_order, 10);
        if (!isNaN(n)) ord = n;
      }
      return {
        public_id: r.public_id,
        url: r.secure_url || ('https://res.cloudinary.com/' + CLOUD + '/image/upload/v' + r.version + '/' + r.public_id + '.' + r.format),
        order: ord,
        created_at: r.created_at || ''
      };
    });

    // 순서번호 우선, 같으면 업로드 시간순
    photos.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (a.created_at > b.created_at) ? 1 : -1;
    });

    return {
      statusCode: 200,
      headers: { 'Cache-Control': 'no-store' },
      body: JSON.stringify({ ok: true, photos: photos })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: '클라우드 연결 실패: ' + e.message }) };
  }
};

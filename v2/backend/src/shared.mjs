const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);

export function reply(event, status, body) {
  const origin = event.headers?.origin || '';
  return {
    statusCode: status,
    headers: {
      'content-type': 'application/json',
      ...(allowed.includes(origin) ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}),
    },
    body: JSON.stringify(body),
  };
}

export function originOk(event) {
  const origin = event.headers?.origin || '';
  return allowed.includes(origin);
}

export function parse(event) {
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : event.body || '';
    return JSON.parse(raw);
  } catch { return null; }
}

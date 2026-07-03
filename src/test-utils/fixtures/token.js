export const accessToken = {
  aud: '123',
  iss: '123',
  iat: 123,
  nbf: 123,
  exp: 123,
  acr: '1',
  aio: '123',
  amr: ['pwd'],
  appid: '123',
  appidacr: '2',
  family_name: 'Smith',
  given_name: 'Mary',
  ipaddr: '192.0.0.1',
  oid: '123',
  rh: '123',
  scp: 'default',
  sid: '123',
  sub: '123',
  tid: '123',
  unique_id: '123',
  upn: '[redacted]',
  uti: '123',
  ver: '1.0',
  xms_ftd: '123'
}

export const accessTokenWithRole = {
  ...accessToken,
  roles: ['admin']
}

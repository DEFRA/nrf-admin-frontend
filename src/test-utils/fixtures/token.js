/* eslint-disable no-secrets/no-secrets */
export const accessToken = {
  aud: 'api://60c013ec-33b1-4266-9b0e-016ff7841a6d',
  iss: 'https://sts.windows.net/6f504113-6b64-43f2-ade9-242e05780007/',
  iat: 1783075763,
  nbf: 1783075763,
  exp: 1783081034,
  acr: '1',
  aio: 'AVQAq/8cAAAAsOzMcc+VveUbHT8Mx7PDZZftA9aOPTao4wY388OofljF5gDeifSSBT5BiijcokKjIUEAHMxlAIAH8X1bb6SVGp9lx+u5S3r1d3gCUV7Oct0=',
  amr: ['pwd'],
  appid: '60c013ec-33b1-4266-9b0e-016ff7841a6d',
  appidacr: '2',
  family_name: 'Smith',
  given_name: 'Mary',
  ipaddr: '192.0.0.1',
  oid: 'd576fdec-486f-4d08-affb-29b2b3667be6',
  rh: '1.AToAE0FQb2Rr8kOt6SQuBXgAB-wTwGCxM2ZCmw4Bb_eEGm0AAB86AA.',
  scp: 'default',
  sid: '006b4cda-06f1-901e-71d5-fb5b6a1349e5',
  sub: 'UbFTZP_kH5LVLWbcS2bcL2Bkv8Bu8iswF_AxR934YrI',
  tid: '6f504113-6b64-43f2-ade9-242e05780007',
  unique_id: '1123123',
  upn: '[redacted]',
  uti: 'oUDN_sGhjka38IW_1FwKAA',
  ver: '1.0',
  xms_ftd: '4K0-OSXAE2ID8Y2OKdfYoZUnH_xt55U2wiI3rHs3AfUBZnJhbmNlYy1kc21z'
}
/* eslint-enable no-secrets/no-secrets */

export const accessTokenWithRole = {
  ...accessToken,
  roles: ['admin']
}

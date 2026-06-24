import Blankie from 'blankie'

/**
 * Manage content security policies.
 * @satisfies {import('@hapi/hapi').Plugin}
 */
const contentSecurityPolicy = {
  plugin: Blankie,
  options: {
    // GOV.UK frontend script hash - see https://frontend.design-system.service.gov.uk/import-javascript/#if-our-inline-javascript-snippet-is-blocked-by-a-content-security-policy
    defaultSrc: ['self'],
    baseUri: ['self'],
    fontSrc: ['self'],
    connectSrc: ['self'],
    mediaSrc: ['none'],
    styleSrc: ['self'],
    scriptSrc: [
      'self',
      "'sha256-GUQ5ad8JK5KmEWmROf3LZd9ge94daqNvd8xy9YS1iDw='" // eslint-disable-line no-secrets/no-secrets
    ],
    imgSrc: ['self'],
    frameSrc: ['self'],
    objectSrc: ['none'],
    frameAncestors: ['none'],
    formAction: ['self'],
    manifestSrc: ['self'],
    workerSrc: ['none'],
    generateNonces: false
  }
}

export { contentSecurityPolicy }

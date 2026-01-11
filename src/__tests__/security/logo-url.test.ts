describe('getLogoUrl Security Check', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should NOT leak token to untrusted domains', async () => {
    jest.mock('@/env', () => ({
      env: {
        LOGO_API: 'SECRET_TOKEN',
      },
    }));

    // Re-import to get the mocked env
    const { getLogoUrl } = await import('@/lib/utils');
    const untrustedUrl = 'https://malicious.com/image.png';
    const result = getLogoUrl(untrustedUrl);
    
    expect(result).toBe('https://malicious.com/image.png');
  });

  it('should append token to trusted domains', async () => {
    jest.mock('@/env', () => ({
     env: {
       LOGO_API: 'SECRET_TOKEN',
     },
   }));

   const { getLogoUrl } = await import('@/lib/utils');
   
   const trustedUrl1 = 'https://img.logo.dev/google.com';
   const result1 = getLogoUrl(trustedUrl1);
   expect(result1).toBe('https://img.logo.dev/google.com?token=SECRET_TOKEN');

   const trustedUrl2 = 'https://logo.clearbit.com/google.com';
   const result2 = getLogoUrl(trustedUrl2);
   expect(result2).toBe('https://logo.clearbit.com/google.com?token=SECRET_TOKEN');
 });

 it('should return relative URLs as is without token', async () => {
    jest.mock('@/env', () => ({
        env: {
            LOGO_API: 'SECRET_TOKEN',
        },
    }));

    const { getLogoUrl } = await import('@/lib/utils');
    const relativeUrl = '/images/logo.png';
    const result = getLogoUrl(relativeUrl);
    expect(result).toBe('/images/logo.png');
 });
});







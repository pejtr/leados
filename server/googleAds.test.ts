import { describe, it, expect } from 'vitest';

describe('Google Ads Configuration', () => {
  it('VITE_GOOGLE_ADS_ID should be set and start with AW-', () => {
    const adsId = process.env.VITE_GOOGLE_ADS_ID;
    expect(adsId).toBeDefined();
    expect(adsId).toMatch(/^AW-\d+$/);
  });

  it('VITE_GOOGLE_ADS_LABEL_PURCHASE should be set', () => {
    const label = process.env.VITE_GOOGLE_ADS_LABEL_PURCHASE;
    expect(label).toBeDefined();
    expect(label!.length).toBeGreaterThan(10);
  });

  it('VITE_GOOGLE_ADS_LABEL_SIGNUP should be set', () => {
    const label = process.env.VITE_GOOGLE_ADS_LABEL_SIGNUP;
    expect(label).toBeDefined();
    expect(label!.length).toBeGreaterThan(10);
  });

  it('VITE_GOOGLE_ADS_LABEL_SUBSCRIPTION should be set', () => {
    const label = process.env.VITE_GOOGLE_ADS_LABEL_SUBSCRIPTION;
    expect(label).toBeDefined();
    expect(label!.length).toBeGreaterThan(10);
  });

  it('conversion send_to format should be AW-ID/LABEL', () => {
    const adsId = process.env.VITE_GOOGLE_ADS_ID;
    const purchaseLabel = process.env.VITE_GOOGLE_ADS_LABEL_PURCHASE;
    if (adsId && purchaseLabel) {
      const sendTo = `${adsId}/${purchaseLabel}`;
      expect(sendTo).toMatch(/^AW-\d+\/[A-Za-z0-9_-]+$/);
    }
  });
});

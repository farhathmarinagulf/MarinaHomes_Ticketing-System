// Netlify sets this at build time so the browser and API use the same limit.
const configured = Number(process.env.NEXT_PUBLIC_ATTACHMENT_LIMIT_MB ?? 15);
export const attachmentLimitMb =
  Number.isFinite(configured) && configured > 0 ? Math.min(configured, 15) : 15;
export const attachmentLimitBytes = attachmentLimitMb * 1024 * 1024;
export const imageLimitBytes = Math.min(5 * 1024 * 1024, attachmentLimitBytes);
export const uploadHelp = `Up to 3 images, ${imageLimitBytes / 1024 / 1024} MB each and ${attachmentLimitMb} MB total.`;

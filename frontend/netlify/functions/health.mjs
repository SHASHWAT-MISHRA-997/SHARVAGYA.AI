/**
 * Minimal deployment health endpoint.
 *
 * This intentionally exposes no configuration or secrets. It proves that the
 * Netlify Functions runtime is available before application routes are moved
 * from the existing FastAPI service.
 */
export default async () => Response.json(
  {
    status: 'ok',
    service: 'SHARVAGYA.AI Netlify Functions',
  },
  {
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  },
);

export const config = {
  path: '/api/v1/health',
};

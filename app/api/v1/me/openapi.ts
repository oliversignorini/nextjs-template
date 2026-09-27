import { registry } from '@/lib/openapi/registry'
import { commonErrorResponses } from '@/lib/openapi/common'
import { profileSchema } from '@/lib/profiles/schemas'

registry.registerPath({
  method: 'get',
  path: '/api/v1/me',
  summary: "The caller's own profile (id, email, role) -- API parity with the UI's role-aware nav",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'The caller profile',
      content: { 'application/json': { schema: profileSchema } },
    },
    ...commonErrorResponses,
  },
})

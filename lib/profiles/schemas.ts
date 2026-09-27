import { z } from 'zod'
import { registry } from '@/lib/openapi/registry'

export const profileSchema = registry.register(
  'Profile',
  z.object({
    id: z.uuid(),
    email: z.email(),
    role: z.enum(['admin', 'member']),
  })
)

export type ProfileResponse = z.infer<typeof profileSchema>

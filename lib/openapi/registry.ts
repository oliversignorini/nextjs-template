import { OpenAPIRegistry, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

extendZodWithOpenApi(z)

/** One registry for the whole API. Every domain's schemas.ts registers its
 * request/response shapes here; scripts/openapi/generate.ts turns this into
 * openapi.json. Keep registration next to the schema it documents. */
export const registry = new OpenAPIRegistry()

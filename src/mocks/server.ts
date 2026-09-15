import { setupServer } from "msw/node"

import { handlers } from "./handlers"

/**
 * MSW untuk sisi server.
 *
 * Browser tidak pernah memanggil backend secara langsung — seluruh request data
 * berjalan lewat Server Component dan Server Action — sehingga cukup satu
 * interceptor di runtime Node.js, tanpa service worker di browser.
 */
export const server = setupServer(...handlers)

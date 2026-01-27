import { decode, encode } from '@msgpack/msgpack';
import type { Encoder } from '@trpc/server/adapters/ws';

import { stripUndefined } from './utils.js';

/**
 * MessagePack encoder for tRPC WebSocket connections.
 * Provides binary encoding for improved performance and smaller payloads.
 *
 * @example
 * ```ts
 * // Client
 * import { createWSClient } from '@trpc/client';
 * import { msgpackEncoder } from 'trpc-msgpack';
 *
 * const wsClient = createWSClient({
 *   url: 'ws://localhost:3001',
 *   experimental_encoder: msgpackEncoder,
 * });
 *
 * // Server
 * import { applyWSSHandler } from '@trpc/server/adapters/ws';
 * import { msgpackEncoder } from 'trpc-msgpack';
 *
 * applyWSSHandler({
 *   wss,
 *   router: appRouter,
 *   experimental_encoder: msgpackEncoder,
 * });
 * ```
 */
export const msgpackEncoder: Encoder = {
  encode: (data) => encode(stripUndefined(data)),
  decode: (data) => {
    if (typeof data === 'string') {
      throw new Error(
        'msgpackEncoder received string data but expected binary. ' +
          'Ensure both client and server are configured with experimental_encoder.',
      );
    }
    const uint8 = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
    return decode(uint8);
  },
};

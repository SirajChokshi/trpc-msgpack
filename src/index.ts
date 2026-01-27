/**
 * trpc-msgpack - MessagePack encoder for tRPC WebSocket connections
 *
 * @packageDocumentation
 */

export { msgpackEncoder } from './encoder.js';
export { stripUndefined } from './utils.js';

// Re-export Encoder type for convenience
export type { Encoder } from '@trpc/server/adapters/ws';

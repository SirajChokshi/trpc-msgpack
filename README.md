# trpc-msgpack

MessagePack encoder for tRPC WebSocket connections. Provides binary encoding for improved performance and smaller payloads compared to JSON.

## Installation

```bash
npm install trpc-msgpack @msgpack/msgpack
```

**Peer Dependencies:**
- `@trpc/client` >=11.9.0
- `@trpc/server` >=11.9.0
- `@msgpack/msgpack` >=3.0.0

`experimental_encoder` option for WebSocket connections was introduced in tRPC v11.9.0.

## Usage

This package provides a `msgpackEncoder` that works with tRPC's `experimental_encoder` option for WebSocket connections.

### Client Setup

```typescript
import { createWSClient, wsLink } from '@trpc/client';
import { msgpackEncoder } from 'trpc-msgpack';

const wsClient = createWSClient({
  url: 'ws://localhost:3001',
  experimental_encoder: msgpackEncoder,
});

// Use with your tRPC client
const client = createTRPCClient<AppRouter>({
  links: [wsLink({ client: wsClient })],
});
```

### Server Setup

```typescript
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { msgpackEncoder } from 'trpc-msgpack';

const wss = new WebSocketServer({ port: 3001 });

applyWSSHandler({
  wss,
  router: appRouter,
  createContext: () => ({}),
  experimental_encoder: msgpackEncoder,
});
```

## Why MessagePack?

MessagePack is a binary serialization format that offers:

- **Smaller payloads**: Binary encoding is more compact than JSON text
- **Faster parsing**: Binary formats are faster to parse than text-based formats
- **Full type support**: Supports all JSON types plus binary data

Binary messages can provide noticeable speed improvements for latency-sensitive prefetching and subscription handling.

## API

### `msgpackEncoder`

The main encoder object that implements tRPC's `Encoder` interface.

```typescript
import { msgpackEncoder } from 'trpc-msgpack';

// Use with tRPC's experimental_encoder option
const wsClient = createWSClient({
  url: 'ws://localhost:3001',
  experimental_encoder: msgpackEncoder,
});
```

### `stripUndefined`

A utility function that recursively removes `undefined` properties from objects. This is used internally by `msgpackEncoder` to ensure compatibility with tRPC's optional field handling, since MessagePack converts `undefined` to `null`.

```typescript
import { stripUndefined } from 'trpc-msgpack';

const data = { a: 1, b: undefined, c: { d: undefined } };
const stripped = stripUndefined(data);
// Result: { a: 1, c: {} }
```

### `Encoder` (type)

Re-exported from `@trpc/server/adapters/ws` for convenience.

```typescript
import type { Encoder } from 'trpc-msgpack';

const customEncoder: Encoder = {
  encode: (data) => /* ... */,
  decode: (data) => /* ... */,
};
```

## Important Notes

1. **Both client and server must use the same encoder**: If you configure `msgpackEncoder` on the client, you must also configure it on the server, and vice versa. Mismatched encoders will result in errors.

2. **Binary frames**: MessagePack uses binary WebSocket frames, not text frames. The encoder will throw a helpful error if it receives string data instead of binary data.

3. **undefined handling**: MessagePack converts `undefined` to `null`. The encoder uses `stripUndefined` to remove `undefined` properties before encoding, matching tRPC JSON encoder's behavior where `undefined` properties are omitted.

## License

MIT

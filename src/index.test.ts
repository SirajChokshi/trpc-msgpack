import { decode, encode } from '@msgpack/msgpack';
import { describe, expect, it } from 'vitest';

import { msgpackEncoder, stripUndefined } from './index.js';

describe('stripUndefined', () => {
  it('returns primitives unchanged', () => {
    expect(stripUndefined(42)).toBe(42);
    expect(stripUndefined('hello')).toBe('hello');
    expect(stripUndefined(true)).toBe(true);
    expect(stripUndefined(null)).toBe(null);
  });

  it('returns undefined as-is at the top level', () => {
    expect(stripUndefined(undefined)).toBe(undefined);
  });

  it('removes undefined properties from objects', () => {
    const input = { a: 1, b: undefined, c: 'test' };
    const result = stripUndefined(input);
    expect(result).toEqual({ a: 1, c: 'test' });
    expect('b' in result).toBe(false);
  });

  it('handles nested objects', () => {
    const input = {
      level1: {
        level2: {
          keep: 'value',
          remove: undefined,
        },
        alsoRemove: undefined,
      },
      topLevel: 'stays',
    };
    const result = stripUndefined(input);
    expect(result).toEqual({
      level1: {
        level2: {
          keep: 'value',
        },
      },
      topLevel: 'stays',
    });
  });

  it('handles arrays', () => {
    const input = [1, 2, undefined, 3];
    const result = stripUndefined(input);
    expect(result).toEqual([1, 2, undefined, 3]);
  });

  it('handles arrays with objects containing undefined', () => {
    const input = [
      { a: 1, b: undefined },
      { c: undefined, d: 2 },
    ];
    const result = stripUndefined(input);
    expect(result).toEqual([{ a: 1 }, { d: 2 }]);
  });

  it('handles empty objects', () => {
    expect(stripUndefined({})).toEqual({});
  });

  it('handles objects where all properties are undefined', () => {
    const input = { a: undefined, b: undefined };
    const result = stripUndefined(input);
    expect(result).toEqual({});
  });

  describe('defensive handling', () => {
    it('handles circular references without crashing', () => {
      const obj: any = { a: 1, b: 2 };
      obj.self = obj;
      const result = stripUndefined(obj);
      expect(result.a).toBe(1);
      expect(result.b).toBe(2);
    });

    it('handles deeply nested circular references', () => {
      const obj: any = { level1: { level2: { level3: {} } } };
      obj.level1.level2.level3.back = obj;
      expect(() => stripUndefined(obj)).not.toThrow();
    });

    it('throws error when depth exceeds limit', () => {
      let deep: any = {};
      let current = deep;
      for (let i = 0; i < 150; i++) {
        current.nested = {};
        current = current.nested;
      }
      expect(() => stripUndefined(deep)).toThrow('Maximum depth');
    });

    it('handles objects at exactly max depth', () => {
      let deep: any = {};
      let current = deep;
      for (let i = 0; i < 99; i++) {
        current.nested = {};
        current = current.nested;
      }
      expect(() => stripUndefined(deep)).not.toThrow();
    });

    it('strips undefined in circular structures', () => {
      const obj: any = { a: 1, b: undefined };
      obj.self = obj;
      const result = stripUndefined(obj);
      expect(result.a).toBe(1);
      expect('b' in result).toBe(false);
    });
  });
});

describe('msgpackEncoder', () => {
  describe('encode', () => {
    it('returns Uint8Array', () => {
      const result = msgpackEncoder.encode({ foo: 'bar' });
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it('strips undefined before encoding', () => {
      const data = { keep: 'value', remove: undefined };
      const encoded = msgpackEncoder.encode(data);
      const decoded = decode(encoded as Uint8Array);
      expect(decoded).toEqual({ keep: 'value' });
      expect('remove' in (decoded as object)).toBe(false);
    });

    it('encodes various data types', () => {
      const data = {
        string: 'hello',
        number: 42,
        float: 3.14,
        boolean: true,
        nullValue: null,
        array: [1, 2, 3],
        nested: { a: { b: { c: 1 } } },
      };
      const encoded = msgpackEncoder.encode(data);
      expect(encoded).toBeInstanceOf(Uint8Array);
      expect(decode(encoded as Uint8Array)).toEqual(data);
    });
  });

  describe('decode', () => {
    it('decodes Uint8Array', () => {
      const original = { foo: 'bar', num: 123 };
      const encoded = encode(original);
      const decoded = msgpackEncoder.decode(encoded);
      expect(decoded).toEqual(original);
    });

    it('decodes ArrayBuffer', () => {
      const original = { foo: 'bar', num: 123 };
      const encoded = encode(original);
      const arrayBuffer = encoded.buffer.slice(
        encoded.byteOffset,
        encoded.byteOffset + encoded.byteLength,
      );
      const decoded = msgpackEncoder.decode(arrayBuffer);
      expect(decoded).toEqual(original);
    });

    it('throws on string input with helpful error message', () => {
      expect(() => msgpackEncoder.decode('{"foo":"bar"}')).toThrow(
        'msgpackEncoder received string data but expected binary',
      );
      expect(() => msgpackEncoder.decode('{"foo":"bar"}')).toThrow(
        'Ensure both client and server are configured with experimental_encoder',
      );
    });
  });

  describe('round-trip', () => {
    it('maintains data integrity for simple objects', () => {
      const data = { message: 'hello world', count: 42 };
      const encoded = msgpackEncoder.encode(data);
      const decoded = msgpackEncoder.decode(encoded);
      expect(decoded).toEqual(data);
    });

    it('maintains data integrity for complex nested structures', () => {
      const data = {
        users: [
          { id: 1, name: 'Alice', tags: ['admin', 'user'] },
          { id: 2, name: 'Bob', tags: ['user'] },
        ],
        metadata: {
          version: '1.0.0',
          timestamp: 1234567890,
        },
      };
      const encoded = msgpackEncoder.encode(data);
      const decoded = msgpackEncoder.decode(encoded);
      expect(decoded).toEqual(data);
    });

    it('handles tRPC-like message structures', () => {
      const requestMessage = {
        id: 1,
        jsonrpc: '2.0',
        method: 'query',
        params: {
          path: 'user.getById',
          input: { id: '123' },
        },
      };
      const encoded = msgpackEncoder.encode(requestMessage);
      const decoded = msgpackEncoder.decode(encoded);
      expect(decoded).toEqual(requestMessage);
    });

    it('handles tRPC-like response structures', () => {
      const responseMessage = {
        id: 1,
        jsonrpc: '2.0',
        result: {
          type: 'data',
          data: {
            user: { id: '123', name: 'Test User' },
          },
        },
      };
      const encoded = msgpackEncoder.encode(responseMessage);
      const decoded = msgpackEncoder.decode(encoded);
      expect(decoded).toEqual(responseMessage);
    });

    it('handles subscription messages', () => {
      const subMessage = {
        id: 1,
        jsonrpc: '2.0',
        result: {
          type: 'started',
        },
      };
      const dataMessage = {
        id: 1,
        jsonrpc: '2.0',
        result: {
          type: 'data',
          data: { event: 'user.created', payload: { id: '456' } },
        },
      };

      expect(msgpackEncoder.decode(msgpackEncoder.encode(subMessage))).toEqual(
        subMessage,
      );
      expect(msgpackEncoder.decode(msgpackEncoder.encode(dataMessage))).toEqual(
        dataMessage,
      );
    });

    it('strips undefined in nested structures during encoding', () => {
      const data = {
        result: {
          type: 'data',
          data: { value: 1 },
          context: undefined,
        },
        meta: undefined,
      };
      const encoded = msgpackEncoder.encode(data);
      const decoded = msgpackEncoder.decode(encoded);
      expect(decoded).toEqual({
        result: {
          type: 'data',
          data: { value: 1 },
        },
      });
    });
  });
});

describe('encoder size comparison', () => {
  it('produces smaller output than JSON for typical data', () => {
    const data = {
      users: Array.from({ length: 10 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        active: i % 2 === 0,
      })),
    };

    const jsonSize = JSON.stringify(data).length;
    const msgpackSize = (msgpackEncoder.encode(data) as Uint8Array).length;

    expect(msgpackSize).toBeLessThan(jsonSize);
  });
});

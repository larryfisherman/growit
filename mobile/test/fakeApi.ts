/// <reference types="node" />
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Socket } from 'node:net';

/// A real HTTP server standing in for the GrowIt API.
///
/// Real rather than an axios adapter on purpose: the code under test is the whole
/// client path - interceptors, token refresh, timeouts, transport failures - and a
/// stand-in below axios would skip exactly the parts that decide whether a write
/// survives. Tests script the replies; every request that arrives is recorded.

export type RecordedRequest = {
  method: string;
  path: string;
  authorization: string | undefined;
  body: any;
};

/// `drop` closes the socket without answering: what a dead link or a proxy cutting the
/// connection looks like from the phone - no status, just a failed request.
export type Reply = { status: number; body?: unknown } | { drop: true };

type Handler = (request: RecordedRequest) => Reply | Promise<Reply>;

const defaultHandler: Handler = () => ({ status: 200, body: {} });

class FakeApi {
  requests: RecordedRequest[] = [];
  url = '';

  private handler: Handler = defaultHandler;
  private readonly sockets = new Set<Socket>();
  private readonly server = createServer((req, res) => void this.handle(req, res));

  async start(): Promise<void> {
    this.server.on('connection', (socket) => {
      // Neither the server nor a kept-alive connection should hold a finished test
      // file open.
      socket.unref();
      this.sockets.add(socket);
      socket.on('close', () => this.sockets.delete(socket));
    });

    await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve));
    this.server.unref();

    const address = this.server.address();
    if (!address || typeof address === 'string') throw new Error('fake API has no port');
    this.url = `http://127.0.0.1:${address.port}`;
  }

  respondWith(handler: Handler) {
    this.handler = handler;
  }

  reset() {
    this.requests = [];
    this.handler = defaultHandler;
    this.dropConnections();
  }

  /// Cuts every open connection, including requests a test is still holding.
  dropConnections() {
    for (const socket of this.sockets) socket.destroy();
  }

  private async handle(req: IncomingMessage, res: ServerResponse) {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const text = Buffer.concat(chunks).toString('utf8');

    const request: RecordedRequest = {
      method: req.method ?? 'GET',
      path: req.url ?? '/',
      authorization: req.headers.authorization,
      body: text ? JSON.parse(text) : undefined,
    };
    this.requests.push(request);

    const reply = await this.handler(request);

    if ('drop' in reply) {
      req.socket.destroy();
      return;
    }

    if (res.destroyed) return;
    res.writeHead(reply.status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(reply.body ?? {}));
  }
}

export const fakeApi = new FakeApi();

/// Cognito, as far as the app can tell: the one endpoint behind every token refresh.
///
/// `unreachable` - the request never lands (no signal, DNS, timeout);
/// `refuses`    - Cognito answers no (refresh token revoked or expired);
/// `issues`     - a fresh access token comes back.
type CognitoMode = 'unreachable' | 'refuses' | 'issues';

class FakeCognito {
  mode: CognitoMode = 'unreachable';
  calls = 0;
  private issued = 0;

  /// The id token is decoded by the app for the user's id, so it has to be a real
  /// (unsigned) JWT shape.
  private idTokenFor(userId: string) {
    const claims = Buffer.from(JSON.stringify({ sub: userId, email: `${userId}@test`, name: userId }))
      .toString('base64url');
    return `header.${claims}.signature`;
  }

  userId = 'user';

  reset() {
    this.mode = 'unreachable';
    this.calls = 0;
  }

  async answer(): Promise<Response> {
    this.calls += 1;

    if (this.mode === 'unreachable') throw new TypeError('Network request failed');

    if (this.mode === 'refuses') {
      return new Response(
        JSON.stringify({ __type: 'NotAuthorizedException', message: 'Refresh Token has expired' }),
        { status: 400 },
      );
    }

    this.issued += 1;
    return new Response(
      JSON.stringify({
        AuthenticationResult: {
          AccessToken: `refreshed-${this.userId}-${this.issued}`,
          IdToken: this.idTokenFor(this.userId),
          ExpiresIn: 3600,
        },
      }),
      { status: 200 },
    );
  }
}

export const fakeCognito = new FakeCognito();

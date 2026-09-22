import http from 'node:http';
import { once } from 'node:events';

// Test-only proxy: preserve server behavior while controlling response delivery.
export async function onlineFailureProxy(upstream) {
  let armed = false, held, waiter;
  let ready = 0, start = 0;
  const sockets = new Set();
  const proxy = http.createServer(async (req, res) => {
    try {
      if (req.url === '/test/arm') { armed = true; res.end('armed'); return; }
      if (req.url === '/test/wait-held') {
        if (held) res.end('held'); else waiter = res;
        return;
      }
      if (req.url === '/test/release') {
        held.res.writeHead(held.status, { 'Content-Type': 'application/json' }); held.res.end(held.body); held = null;
        res.end('released'); return;
      }
      if (req.url === '/test/counts') { res.end(`ready=${ready},start=${start}`); return; }
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const response = await fetch(upstream + req.url, { method: req.method,
        headers: { 'Content-Type': 'application/json', ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {}) },
        ...(chunks.length ? { body: Buffer.concat(chunks) } : {}) });
      const body = await response.text();
      if (armed && req.url.endsWith('/native-view')) {
        armed = false; held = { res, status: response.status, body };
        waiter?.end('held'); waiter = null; return;
      }
      if (req.method === 'POST' && req.url.endsWith('/ready')) {
        ready++;
        // The real server already committed the action, but the client never receives its reply.
        res.destroy(); return;
      }
      if (req.method === 'POST' && req.url.endsWith('/start')) start++;
      res.writeHead(response.status, { 'Content-Type': 'application/json' }); res.end(body);
    } catch (error) { res.writeHead(500); res.end(JSON.stringify({ error: error.message })); }
  });
  proxy.on('connection', socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); });
  proxy.listen(0, '127.0.0.1'); await once(proxy, 'listening');
  return { url: `http://127.0.0.1:${proxy.address().port}`, close: async () => {
    const closing = new Promise(resolve => proxy.close(resolve));
    for (const socket of sockets) socket.destroy(); await closing;
  } };
}

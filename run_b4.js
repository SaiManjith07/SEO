import { server } from './packages/mcp/dist/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

class MockTransport {
  sentMessages = [];
  async start() {}
  async close() {}
  async send(msg) {
    this.sentMessages.push(msg);
    if (this.otherSide) {
      setTimeout(() => this.otherSide.onmessage(msg), 0);
    }
  }
}

async function run() {
  const { cruxPlugin } = await import('./packages/plugins/crux/dist/index.js');
  cruxPlugin.fetchRecord = async () => [];
  
  const srv = new MockTransport();
  const cli = new MockTransport();
  srv.otherSide = cli;
  cli.otherSide = srv;
  
  await server.connect(srv);
  
  const p = new Promise(r => {
    cli.onmessage = (msg) => { if(msg.id===1) r(msg); };
  });
  
  await cli.send({
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: { name: 'get_crux_report', arguments: { url: 'https://small-personal-site.com', mode: 'url' } }
  });
  
  const res = await p;
  console.log(res.result.content[0].text);
  process.exit(0);
}
run().catch(console.error);

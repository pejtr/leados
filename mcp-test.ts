import { createMcpClient } from '@modelcontextprotocol/sdk/client';

async function main() {
    const client = createMcpClient({ name: 'demo' });

    // stdio transport expects an MCP server process.
    // We spawn the server through the helper package so it works with both Windows shells.
    client.connect({
        transport: 'stdio',
        // Use npx as a launcher; user already confirmed it can install.
        // If stdio spawn differs in your environment, adjust command/args.
        command: process.execPath,
        args: ['node_modules/@postman/postman-mcp-server/dist/src/index.js', '--minimal'],
    });

    const tools = await client.listTools();
    console.log('Tools count:', tools.tools?.length ?? tools.length);
    console.log('First tools:', tools.tools?.slice(0, 10)?.map(t => t.name));

    // Demonstrate one tool call if present.
    const first = tools.tools?.[0];
    if (first?.name) {
        const res = await client.callTool({ toolName: first.name, arguments: {} });
        console.log('Call result for', first.name, res);
    }

    await client.close();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

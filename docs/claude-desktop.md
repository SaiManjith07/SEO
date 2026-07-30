# Claude Desktop MCP Integration

SEOKit can be globally registered inside the Claude Desktop application.

## Configuration Setup

Running `seokit init` automatically finds the platform-specific directory:
*   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
*   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
*   **Linux**: `~/.config/Claude/claude_desktop_config.json`

It appends the `"seokit"` server mapping to run using `npx -y seokit mcp` commands.
Restart Claude Desktop to start the server!

# SEOKit v2 — Quick Setup Guide for Cursor MCP

Follow these steps to connect and run the SEOKit v2 MCP server on your local machine using the Cursor IDE.

---

## Step 1: Install Node.js
Ensure you have **Node.js** (v18 or higher) installed on your system. You can verify this by running:
```bash
node -v
```

---

## Step 2: Extract & Build Project
1. Unzip the project folder received from your friend to a location on your machine (e.g., `C:\projects\seo`).
2. Open your terminal in the extracted folder path:
   ```bash
   cd C:\projects\seo\SEO\seokit
   ```
3. Run the installation and build commands:
   ```bash
   npm install
   npm run build
   ```

---

## Step 3: Register MCP Server in Cursor Settings

1. Open your **Cursor IDE**.
2. Navigate to **Settings** (Gear Icon on top-right) > **Features** > **MCP**.
3. Click the **+ Add New MCP Server** button.
4. Input the following details:
   *   **Name**: `seokit-v2`
   *   **Type**: `command`
   *   **Command**: `node C:/projects/seo/SEO/seokit/packages/mcp/dist/index.js`  
       *(Note: Update the path `C:/projects/seo` to match the exact unzipped directory location on your laptop)*.
5. Click **Save** to enable the server tools.

---

## Step 4: Verify Connection
Once saved, you should see a green dot indicator next to `seokit-v2` showing that the server has connected successfully. The AI Agent will now be able to run `verify_workspace` and `verify_page` tools directly on your code!

#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// 创建服务器实例
const server = new Server(
  {
    name: "mcp-demo",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "echo",
        description: "返回输入的文本",
        inputSchema: {
          type: "object",
          properties: {
            message: {
              type: "string",
              description: "要回显的消息",
            },
          },
          required: ["message"],
        },
      },
      {
        name: "add",
        description: "计算两个数字的和",
        inputSchema: {
          type: "object",
          properties: {
            a: {
              type: "number",
              description: "第一个数字",
            },
            b: {
              type: "number",
              description: "第二个数字",
            },
          },
          required: ["a", "b"],
        },
      },
    ],
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "echo": {
      const schema = z.object({ message: z.string() });
      const parsed = schema.parse(args);
      return {
        content: [
          {
            type: "text",
            text: `Echo: ${parsed.message}`,
          },
        ],
      };
    }

    case "add": {
      const schema = z.object({
        a: z.number(),
        b: z.number(),
      });
      const parsed = schema.parse(args);
      const result = parsed.a + parsed.b;
      return {
        content: [
          {
            type: "text",
            text: `${parsed.a} + ${parsed.b} = ${result}`,
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // 注意：日志必须输出到 stderr，不能用 console.log
  console.error("MCP Demo Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
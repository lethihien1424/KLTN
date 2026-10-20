import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import path from "node:path";
import type { Page } from "@playwright/test";

// Render Git's pre-purchase UI in memory. Never restore files into the workspace.
export async function mountGitBaseline(page: Page) {
  const original = [
    "src/App.tsx",
    "src/components/dashboard/DashboardBase.tsx",
    "src/pages/du-bao/DuBaoNhuCauPage.tsx",
  ];
  const result = await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import App from './src/App'; createRoot(document.getElementById('root')).render(<App/>);`,
      resolveDir: process.cwd(),
      loader: "tsx",
    },
    bundle: true,
    write: false,
    outdir: "baseline-memory",
    jsx: "automatic",
    format: "esm",
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost:8000"),
      "process.env.NODE_ENV": JSON.stringify("development"),
    },
    plugins: [
      {
        name: "git-ui-reference",
        setup(builder) {
          builder.onLoad({ filter: /\.tsx$/ }, (args) => {
            const relative = path
              .relative(process.cwd(), args.path)
              .replaceAll("\\", "/");
            if (!original.includes(relative)) return;
            return {
              contents: execFileSync(
                "git",
                ["show", `250639d:frontend/${relative}`],
                { encoding: "utf8" },
              ),
              loader: "tsx",
              resolveDir: path.dirname(args.path),
            };
          });
        },
      },
    ],
    logLevel: "silent",
  });
  const javascript = result.outputFiles.find((file) =>
    file.path.endsWith(".js"),
  )!.text;
  const css =
    result.outputFiles.find((file) => file.path.endsWith(".css"))?.text ?? "";
  await page.route("**/__baseline.js", (route) =>
    route.fulfill({ contentType: "application/javascript", body: javascript }),
  );
  await page.route("**/__baseline", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/Login.css"><link rel="stylesheet" href="/Dashboard.css"><link rel="stylesheet" href="/QuanLyTaiKhoan.css"><link rel="stylesheet" href="/DuBaoNhuCau.css"><style>${css}</style></head><body><div id="root"></div><script type="module" src="/__baseline.js"></script></body></html>`,
    }),
  );
}

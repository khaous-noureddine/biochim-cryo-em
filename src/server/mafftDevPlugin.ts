import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import type { Plugin } from "vite";
import { validateAlignmentResult } from "../core/alignmentResult.ts";
import { parseSequenceInput, toUnalignedFasta } from "../core/unalignedInput.ts";

const MAX_INPUT_BYTES = 2_000_000;
const MAX_OUTPUT_BYTES = 16_000_000;
const execFileAsync = promisify(execFile);

function runMafft(inputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("mafft", ["--auto", "--quiet", "--inputorder", inputPath], {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill(), 120_000);
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT_BYTES) child.kill();
    });
    child.stderr.on("data", (chunk: string) => {
      stderr = (stderr + chunk).slice(-4_000);
    });
    child.on("error", (error: NodeJS.ErrnoException) => {
      clearTimeout(timer);
      reject(error.code === "ENOENT"
        ? new Error("MAFFT is not installed. Install it first (macOS: brew install mafft), then retry.")
        : error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0 && stdout.length <= MAX_OUTPUT_BYTES) resolve(stdout);
      else reject(new Error(`MAFFT failed${stderr ? `: ${stderr.trim()}` : ". Check the input or timeout."}`));
    });
  });
}

export function mafftDevPlugin(): Plugin {
  return {
    name: "atlas-local-mafft-development-adapter",
    configureServer(server) {
      server.middlewares.use("/api/align/mafft", async (request, response) => {
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        if (request.method !== "POST") {
          response.statusCode = 405;
          response.end(JSON.stringify({ error: "POST required." }));
          return;
        }
        let tempDirectory: string | undefined;
        try {
          let body = "";
          for await (const chunk of request) {
            body += chunk.toString();
            if (body.length > MAX_INPUT_BYTES) throw new Error("Sequence input exceeds the 2 MB limit.");
          }
          const payload: unknown = JSON.parse(body);
          if (!payload || typeof payload !== "object" || typeof (payload as { source?: unknown }).source !== "string") {
            throw new Error("A sequence source is required.");
          }
          const input = parseSequenceInput((payload as { source: string }).source);
          tempDirectory = await mkdtemp(join(tmpdir(), "atlas-mafft-"));
          const inputPath = join(tempDirectory, "input.fasta");
          await writeFile(inputPath, toUnalignedFasta(input), "utf8");
          const aligned = validateAlignmentResult(await runMafft(inputPath), input.sequences);
          const versionOutput = await execFileAsync("mafft", ["--version"], { timeout: 5_000 });
          const version = (versionOutput.stdout || versionOutput.stderr).trim();
          response.end(JSON.stringify({ alignedFasta: aligned, engine: "MAFFT", version, method: "--auto" }));
        } catch (error) {
          response.statusCode = 400;
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "Alignment failed." }));
        } finally {
          if (tempDirectory) await rm(tempDirectory, { recursive: true, force: true });
        }
      });
    },
  };
}

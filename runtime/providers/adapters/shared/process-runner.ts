import { spawn } from "node:child_process";

export interface ProcessRunResult {
  exitCode: number;
  signal: NodeJS.Signals | null;
  stdout: string;
  stderr: string;
  executionTimeMs: number;
}

export async function runProcess(
  command: string,
  args: readonly string[],
  options: { timeoutMs: number; cwd?: string; env?: NodeJS.ProcessEnv },
): Promise<ProcessRunResult> {
  const started = Date.now();
  return await new Promise<ProcessRunResult>((resolve, reject) => {
    const child = spawn(command, [...args], {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
    }, options.timeoutMs);

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on("close", (exitCode, signal) => {
      clearTimeout(timer);
      resolve({
        exitCode: exitCode ?? -1,
        signal,
        stdout,
        stderr,
        executionTimeMs: Date.now() - started,
      });
    });
  });
}

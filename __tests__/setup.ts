import { spawn } from 'child_process';

export default function setup(): Promise<void> {
  return new Promise((resolve, reject) => {
    const now = spawn('npx', ['now', 'dev', '--listen', '5000']);

    // now CLI writes to stderr
    now.stderr.on('data', (data: string) => {
      if (data.includes('Ready')) {
        global.__NOW_DEV__ = now;
        resolve();
      }
    });
    now.on('error', reject);
  });
}

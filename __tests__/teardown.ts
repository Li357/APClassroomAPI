export default function teardown(): void {
  global.__NOW_DEV__.kill('SIGINT');
}

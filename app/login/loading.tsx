export default function LoginLoading() {
  return (
    <main className="login-loading" aria-busy="true">
      <span className="login-loading-mark" />
      <span>Loading secure sign in…</span>
    </main>
  );
}

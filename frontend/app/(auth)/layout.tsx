// Auth section layout — login/register pages carry their own full-screen
// design, so this layout intentionally renders no shared header/footer/chrome.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

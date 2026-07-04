import ClientHeader from "../components/layout/ClientHeader";

// User/profile section layout — keeps the site header (so the account pages
// still have primary navigation and the page's top padding lines up with the
// fixed header) but drops the storefront footer/chat for a focused account area.
export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ClientHeader />
      {children}
    </>
  );
}

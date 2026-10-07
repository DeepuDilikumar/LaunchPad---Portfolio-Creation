import { Header } from "@/components/marketing/header";
import { Footer } from "@/components/marketing/footer";
import { CookieCard } from "@/components/marketing/cookie-card";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <CookieCard />
    </>
  );
}

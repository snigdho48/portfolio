import type { ReactNode } from "react";
import Header from "./Header";
import Nav from "./Nav";
import TopLeftImg from "./TopLeftImg";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="page bg-site bg-cover bg-no-repeat font-sora relative text-white">
      <TopLeftImg />
      <Nav />
      <Header />
      {children}
    </main>
  );
}

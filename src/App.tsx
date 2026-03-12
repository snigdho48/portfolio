import { useRoutes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import Transition from "@/components/Transition";
import { useScrollNavigation } from "@/hooks/useScrollNavigation";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Work from "@/pages/Work";
import Testimonials from "@/pages/Testimonials";
import Contact from "@/pages/Contact";

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ScrollNavigator() {
  useScrollNavigation();
  return null;
}

const routes = [
  { path: "/", element: <Home /> },
  { path: "/about", element: <About /> },
  { path: "/services", element: <Services /> },
  { path: "/work", element: <Work /> },
  { path: "/testimonials", element: <Testimonials /> },
  { path: "/contact", element: <Contact /> },
];

export default function App() {
  const location = useLocation();
  const element = useRoutes(routes);

  return (
    <Layout>
      <ScrollReset />
      <ScrollNavigator />
      <AnimatePresence mode="wait">
        <div key={location.pathname} className="h-full">
          <Transition />
          {element}
        </div>
      </AnimatePresence>
    </Layout>
  );
}

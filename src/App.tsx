import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Layout         from "@/components/Layout";
import { TransitionProvider } from "@/context/TransitionContext";
import { useScrollNavigation } from "@/hooks/useScrollNavigation";
import Home         from "@/pages/Home";
import About        from "@/pages/About";
import Services     from "@/pages/Services";
import Work         from "@/pages/Work";
import Testimonials from "@/pages/Testimonials";
import Contact      from "@/pages/Contact";

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

/** Activates scroll / swipe / arrow-key navigation */
function ScrollNavigator() {
  useScrollNavigation();
  return null;
}

function AppRoutes() {
  return (
    <Layout>
      <ScrollReset />
      <ScrollNavigator />
      <Routes>
        <Route path="/"             element={<Home />}         />
        <Route path="/about"        element={<About />}        />
        <Route path="/services"     element={<Services />}     />
        <Route path="/work"         element={<Work />}         />
        <Route path="/testimonials" element={<Testimonials />} />
        <Route path="/contact"      element={<Contact />}      />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <TransitionProvider>
      <AppRoutes />
    </TransitionProvider>
  );
}

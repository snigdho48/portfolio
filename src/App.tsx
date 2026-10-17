import { lazy, Suspense, useEffect } from "react";
import { useRoutes, useLocation } from "react-router-dom";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";

const CaseStudy = lazy(() => import("@/pages/CaseStudy"));

function ScrollReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

const routes = [
  { path: "/", element: <Landing /> },
  {
    path: "/work/:slug",
    element: (
      <Suspense fallback={null}>
        <CaseStudy />
      </Suspense>
    ),
  },
];

export default function App() {
  const element = useRoutes(routes);

  return (
    <Layout>
      <ScrollReset />
      {element}
    </Layout>
  );
}

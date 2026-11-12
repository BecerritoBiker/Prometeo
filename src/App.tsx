import { lazy, Suspense, useEffect } from "react";
import PageProviders from "@page-providers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";

const Mapa = lazy(() => import("./pages/Mapa"));
const Estadisticas = lazy(() => import("./pages/Estadisticas"));
const Reportar = lazy(() => import("./pages/Reportar"));
const Auth = lazy(() => import("./pages/Auth"));
const Gestion = lazy(() => import("./pages/Gestion"));
const Privacidad = lazy(() => import("./pages/Privacidad"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1 } } });

function AppRoutes() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <>
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[1000] focus:rounded-md focus:bg-background focus:p-3">
        Ir al contenido
      </a>
      <Suspense fallback={<main id="contenido" className="p-8" role="status">Cargando página…</main>}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/reportar" element={<Reportar />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/gestion" element={<Gestion />} />
          <Route path="/privacidad" element={<Privacidad />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PageProviders>
        <BrowserRouter><AppRoutes /></BrowserRouter>
      </PageProviders>
    </QueryClientProvider>
  );
}

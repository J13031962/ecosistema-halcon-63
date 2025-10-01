import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProviderConsolidated, useAuthConsolidatedContext } from "@/contexts/AuthContextConsolidated";
import { AlarmasProvider } from "@/contexts/AlarmasContext";
import { ThemeProvider } from "next-themes";
import { MainLayout } from "@/components/layout/MainLayout";
import Login from "@/components/auth/Login";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";
import TurnosOperador from "./pages/TurnosOperador";
import DirectorTecnico from "./pages/DirectorTecnico";
import DirectorTecnicoSection from "./pages/DirectorTecnicoSection";
import TecnicoPropio from "./pages/TecnicoPropio";
import TecnicoPropioSection from "./pages/TecnicoPropioSection";
import TecnicoExterno from "./pages/TecnicoExterno";
import TecnicoExternoSection from "./pages/TecnicoExternoSection";
import ReportesTecnicos from "./pages/ReportesTecnicos";
import Configuracion from "./pages/Configuracion";
import NotFound from "./pages/NotFound";
import Usuarios from "./pages/Usuarios";
import GestionUsuariosCompartida from "./pages/GestionUsuariosCompartida";
import PatrullasContratadas from "./pages/PatrullasContratadas";
import PatrullasCorazaConfig from "./pages/PatrullasCorazaConfig";
import Alarmas from "./pages/Alarmas";
import Patrullas from "./pages/Patrullas";
import Ubicaciones from "./pages/Ubicaciones";
import ReportesEjecutivos from "./pages/ReportesEjecutivos";
import Analisis from "./pages/Analisis";
import EstadoGeneral from "./pages/EstadoGeneral";

import CentralAlarmas from "./pages/CentralAlarmas";
import CentralAlarmasOperador from "./pages/CentralAlarmasOperador";

import PatrullasActivas from "./pages/PatrullasActivas";
import HistorialServicios from "./pages/HistorialServicios";
import Asignaciones from "./pages/Asignaciones";
import MiPatrulla from "./pages/MiPatrulla";
import MiPatrullaSupervisor from "./pages/MiPatrullaSupervisor";
import GestionClientes from "./pages/GestionClientes";
import GestionClientesCompleta from "./pages/GestionClientesCompleta";
import IngresarClientes from "./pages/IngresarClientes";
import GenerarCotizaciones from "./pages/GenerarCotizaciones";
import Inventario from "./pages/Inventario";
import IngresarMaterial from "./pages/IngresarMaterial";
import ServiciosTecnicos from "./pages/ServiciosTecnicos";
import HistorialPatrullas from "./pages/HistorialPatrullas";
import HistorialPatrullasOperador from "./pages/HistorialPatrullasOperador";
import HistorialPatrullasDespachador from "./pages/HistorialPatrullasDespachador";
import SeccionDespachador from "./pages/SeccionDespachador";
import ReporteDetallado from "./pages/ReporteDetallado";
import RutasAsignadas from "./pages/RutasAsignadas";
import GenerarAlarma from "./pages/GenerarAlarma";
import Auth from "./pages/Auth";

import RegistroIncidentes from "./pages/RegistroIncidentes";
import RegistroActividades from "./pages/RegistroActividades";
import ReportesSupervisor from "./pages/ReportesSupervisor";
import Mantenimiento from "./pages/Mantenimiento";
import { RoleBasedDashboard } from "@/components/auth/RoleBasedDashboard";
import { SupervisorGPSProvider } from "@/components/supervisor/SupervisorGPSProvider";
import ClientesDirCentral from "./pages/ClientesDirCentral";
import ElementosCotizables from "./pages/ElementosCotizables";
import ReporteUbicacion from "./pages/ReporteUbicacion";
import MinutaOperador from "./pages/MinutaOperador";
import CambioContrasenaDirector from "./pages/CambioContrasenaDirector";
import CambioContrasenaOperador from "./pages/CambioContrasenaOperador";
import CambioContrasenaDespachador from "./pages/CambioContrasenaDespachador";
import CambioContrasenaSupervisor from "./pages/CambioContrasenaSupervisor";

const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated, loading } = useAuthConsolidatedContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<RoleBasedDashboard />} />
      
      {/* Dashboard accessible for multiple roles */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRoles={['administrador', 'operador_alarmas', 'despachador_patrullas', 'director']}>
          <MainLayout>
            <AdminDashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/usuarios" element={
        <ProtectedRoute>
          <MainLayout>
            <Usuarios />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/gestion-usuarios" element={
        <ProtectedRoute requiredRoles={['administrador']}>
          <MainLayout>
            <GestionUsuariosCompartida />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/gestion-usuarios-director" element={
        <ProtectedRoute requiredRoles={['director']}>
          <MainLayout>
            <GestionUsuariosCompartida isDirectorCentral={true} />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/cambio-contrasena-director" element={
        <ProtectedRoute requiredRoles={['director']}>
          <MainLayout>
            <CambioContrasenaDirector />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/cambio-contrasena-operador" element={
        <ProtectedRoute requiredRoles={['operador_alarmas']}>
          <MainLayout>
            <CambioContrasenaOperador />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/cambio-contrasena-despachador" element={
        <ProtectedRoute requiredRoles={['despachador_patrullas']}>
          <MainLayout>
            <CambioContrasenaDespachador />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/cambio-contrasena-supervisor" element={
        <ProtectedRoute requiredRoles={['supervisor_motorizado']}>
          <MainLayout>
            <CambioContrasenaSupervisor />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/patrullas-contratadas" element={
        <ProtectedRoute requiredRoles={['administrador', 'director']}>
          <MainLayout>
            <PatrullasContratadas />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/patrullas-contratadas/:empresaId" element={
        <ProtectedRoute requiredRoles={['administrador', 'director']}>
          <MainLayout>
            <PatrullasCorazaConfig />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/patrullas-coraza" element={<Navigate to="/patrullas-contratadas" replace />} />
      
      <Route path="/configuracion" element={
        <ProtectedRoute requiredRoles={['administrador']}>
          <MainLayout>
            <Configuracion />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reportes" element={
        <ProtectedRoute>
          <MainLayout>
            <Reports />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/alarmas" element={
        <ProtectedRoute>
          <MainLayout>
            <Alarmas />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/patrullas" element={
        <ProtectedRoute>
          <MainLayout>
            <Patrullas />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/ubicaciones" element={
        <ProtectedRoute>
          <MainLayout>
            <Ubicaciones />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Director routes */}
      <Route path="/reportes-ejecutivos" element={
        <ProtectedRoute>
          <MainLayout>
            <ReportesEjecutivos />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/analisis" element={
        <ProtectedRoute>
          <MainLayout>
            <Analisis />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Operador routes */}
      <Route path="/central-alarmas" element={
        <ProtectedRoute>
          <MainLayout>
            <CentralAlarmasOperador />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/minuta-operador" element={
        <ProtectedRoute>
          <MainLayout>
            <MinutaOperador />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Despachador routes */}
      <Route path="/patrullas-activas" element={
        <ProtectedRoute>
          <MainLayout>
            <PatrullasActivas />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reporte-ubicacion" element={
        <ProtectedRoute>
          <MainLayout>
            <ReporteUbicacion />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="/historial-servicios" element={
        <ProtectedRoute>
          <MainLayout>
            <HistorialServicios />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/asignaciones" element={
        <ProtectedRoute>
          <MainLayout>
            <Asignaciones />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Supervisor routes */}
      <Route path="/mi-patrulla" element={
        <ProtectedRoute>
          <MainLayout>
            <MiPatrullaSupervisor />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/rutas-asignadas" element={
        <ProtectedRoute>
          <MainLayout>
            <RutasAsignadas />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/registro-incidentes" element={
        <ProtectedRoute>
          <MainLayout>
            <RegistroIncidentes />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/registro-actividades" element={
        <ProtectedRoute>
          <MainLayout>
            <RegistroActividades />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/eventos" element={
        <ProtectedRoute>
          <MainLayout>
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Eventos del Sistema</h1>
              <p className="text-muted-foreground">Consulta eventos y actividades.</p>
            </div>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/llamadas" element={
        <ProtectedRoute>
          <MainLayout>
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Registro de Llamadas</h1>
              <p className="text-muted-foreground">Historial de llamadas recibidas.</p>
            </div>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/coordinacion" element={
        <ProtectedRoute>
          <MainLayout>
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Coordinación</h1>
              <p className="text-muted-foreground">Coordinación con otras unidades.</p>
            </div>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      
      <Route path="/estado-general" element={
        <ProtectedRoute>
          <MainLayout>
            <EstadoGeneral />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      
        <Route path="/turnos-operador" element={
          <ProtectedRoute>
            <MainLayout>
              <TurnosOperador />
            </MainLayout>
          </ProtectedRoute>
        } />
      
      <Route path="/ingresar-clientes" element={
        <ProtectedRoute>
          <MainLayout>
            <GestionClientesCompleta />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/gestion-clientes-completa" element={
        <ProtectedRoute>
          <MainLayout>
            <GestionClientesCompleta />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/director-tecnico" element={
        <ProtectedRoute>
          <MainLayout>
            <DirectorTecnico />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/director-tecnico-section" element={
        <ProtectedRoute>
          <MainLayout>
            <DirectorTecnicoSection />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tecnico-propio" element={
        <ProtectedRoute>
          <MainLayout>
            <TecnicoPropioSection />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tecnico-propio-section" element={
        <ProtectedRoute>
          <MainLayout>
            <TecnicoPropioSection />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tecnico-externo" element={
        <ProtectedRoute>
          <MainLayout>
            <TecnicoExternoSection />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/tecnico-externo-section" element={
        <ProtectedRoute>
          <MainLayout>
            <TecnicoExternoSection />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reportes-tecnicos" element={
        <ProtectedRoute>
          <MainLayout>
            <ReportesTecnicos />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/generar-cotizaciones" element={
        <ProtectedRoute>
          <MainLayout>
            <GenerarCotizaciones />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/inventario" element={
        <ProtectedRoute>
          <MainLayout>
            <Inventario />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/ingresar-material" element={
        <ProtectedRoute>
          <MainLayout>
            <IngresarMaterial />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/servicios-tecnicos" element={
        <ProtectedRoute>
          <MainLayout>
            <ServiciosTecnicos />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/gestion-clientes" element={
        <ProtectedRoute>
          <MainLayout>
            <GestionClientes />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/historial-patrullas-operador" element={
        <ProtectedRoute>
          <MainLayout>
            <HistorialPatrullasOperador />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/historial-patrullas-despachador" element={
        <ProtectedRoute>
          <MainLayout>
            <HistorialPatrullasDespachador />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/historial-patrullas" element={
        <ProtectedRoute>
          <MainLayout>
            <HistorialPatrullas />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/seccion-despachador" element={
        <ProtectedRoute> 
          <MainLayout>
            <SeccionDespachador />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/generar-alarma" element={
        <ProtectedRoute>
          <MainLayout>
            <GenerarAlarma />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reportes-supervisor" element={
        <ProtectedRoute>
          <MainLayout>
            <ReportesSupervisor />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/mantenimiento" element={
        <ProtectedRoute>
          <MainLayout>
            <Mantenimiento />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/reporte-detallado/:id" element={
        <ProtectedRoute>
          <ReporteDetallado />
        </ProtectedRoute>
      } />
      
      {/* Rutas adicionales */}
      <Route path="/reportes-ventas" element={
        <ProtectedRoute>
          <MainLayout>
            <div className="space-y-6">
              <h1 className="text-2xl font-bold">Reportes de Ventas</h1>
              <p className="text-muted-foreground">Reportes y estadísticas de ventas.</p>
            </div>
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/clientes-dir-central" element={
        <ProtectedRoute>
          <MainLayout>
            <ClientesDirCentral />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/elementos-cotizables" element={
        <ProtectedRoute>
          <MainLayout>
            <ElementosCotizables />
          </MainLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProviderConsolidated>
              <SupervisorGPSProvider>
                <AlarmasProvider>
                  <AppContent />
                </AlarmasProvider>
              </SupervisorGPSProvider>
            </AuthProviderConsolidated>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
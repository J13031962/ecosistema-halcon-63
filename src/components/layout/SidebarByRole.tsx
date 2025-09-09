import { useState } from "react";
import { UserRole } from "@/types/auth";
import { 
  Home, 
  Shield, 
  Users, 
  AlertTriangle, 
  Car, 
  Settings, 
  FileText,
  BarChart3,
  MapPin,
  Clock,
  Phone,
  LogOut,
  Monitor,
  MessageCircle,
  Navigation,
  Building,
  Wrench,
  DollarSign,
  UserCheck,
  UserPlus,
  FileSignature,
  Package,
  Siren,
  TrendingUp,
  ExternalLink,
  Truck,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useAuthConsolidatedContext } from "@/contexts/AuthContextConsolidated";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  external?: boolean;
  subcategory?: MenuItem[];
}

interface MenuCategory {
  category: string;
  items: MenuItem[];
}

// Menús específicos por rol
const getMenuByRole = (role: UserRole): MenuCategory[] => {
  switch (role) {
    case 'administrador':
      return [
        { 
          category: "🛡️ Panel Administrador", 
          items: [
            { title: "Dashboard Principal", url: "/dashboard", icon: Home },
            { title: "Gestión de Usuarios", url: "/gestion-usuarios", icon: Users },
            { title: "Configuración Sistema", url: "/configuracion", icon: Settings },
          ]
        },
        { 
          category: "🎯 Sección Dir Central", 
          items: [
            { title: "Reportes Ejecutivos", url: "/reportes-ejecutivos", icon: BarChart3 },
            { title: "Análisis Avanzado", url: "/analisis", icon: FileText },
            { title: "Estado General", url: "/estado-general", icon: Shield },
            { title: "Gestión Personal", url: "/personal", icon: Users },
            { title: "Clientes", url: "/clientes-dir-central", icon: Building },
          ]
        },
        { 
          category: "🚨 Operaciones Alarmas", 
          items: [
            { title: "Central de Alarmas", url: "/central-alarmas", icon: AlertTriangle },
            { title: "Generar Alarma", url: "/generar-alarma", icon: Siren },
            { title: "Todas las Alarmas", url: "/alarmas", icon: AlertTriangle },
            { title: "Gestión de Clientes", url: "/gestion-clientes", icon: Users },
            { title: "Turnos Operadores", url: "/turnos-operador", icon: Clock },
          ]
        },
        { 
          category: "🚗 Despachador Patrullas", 
          items: [
            { title: "Dashboard Despachador", url: "/seccion-despachador", icon: BarChart3 },
            { title: "Patrullas Activas", url: "/patrullas-activas", icon: Car },
            { title: "Todas las Patrullas", url: "/patrullas", icon: Car },
            { title: "Asignaciones", url: "/asignaciones", icon: MapPin },
            { title: "Gestión Personal Supervisores", url: "/personal-supervisores", icon: UserCheck },
            { title: "Mi Patrulla", url: "/mi-patrulla", icon: Car },
          ]
        },
        { 
          category: "🔧 Servicios Técnicos", 
          items: [
            { title: "Servicios Técnicos", url: "/servicios-tecnicos", icon: Wrench },
            { title: "Técnico Propio", url: "/tecnico-propio", icon: Wrench },
            { title: "Técnico Externo", url: "/tecnico-externo", icon: Wrench },
            { title: "Inventario", url: "/inventario", icon: Package },
            { title: "Ingresar Material", url: "/ingresar-material", icon: Package },
            { title: "Mantenimiento", url: "/mantenimiento", icon: Wrench },
          ]
        },
        { 
          category: "🌐 Enlaces Externos", 
          items: [
            { title: "WhatsApp Web", url: "https://web.whatsapp.com/", icon: MessageCircle, external: true },
            { title: "Plataforma de Monitoreo", url: "https://monitoreo.miscuentas24hs.com/", icon: Monitor, external: true },
            { title: "Plataforma GPS FullTrack", url: "https://fultrack.com", icon: Navigation, external: true },
            { title: "Plataforma GPS ProTrack", url: "https://www.protrack365.com/?lang=es-es", icon: Navigation, external: true },
          ]
        },
        { 
          category: "💼 Ventas", 
          items: [
            { title: "Ingresar Clientes", url: "/ingresar-clientes", icon: UserPlus },
            { title: "Generar Cotizaciones", url: "/generar-cotizaciones", icon: FileSignature },
            { title: "Elementos Cotizables", url: "/elementos-cotizables", icon: DollarSign },
          ]
        },
        { 
          category: "📊 Turnos y Horarios", 
          items: [
            { title: "Turnos Operador", url: "/turnos-operador", icon: Clock },
            { title: "Turnos Supervisor", url: "/turnos-supervisor", icon: Clock },
          ]
        },
        { 
          category: "📝 Supervisor Motorizado", 
          items: [
            { title: "Registro Actividades", url: "/registro-actividades", icon: Clock },
            { title: "Registro Incidentes", url: "/registro-incidentes", icon: AlertTriangle },
            { title: "Rutas Asignadas", url: "/rutas-asignadas", icon: MapPin },
            { title: "Historial Patrullas", url: "/historial-patrullas", icon: Clock },
            { title: "Historial Patrullas Despachador", url: "/historial-patrullas-despachador", icon: Clock },
            { title: "Historial Patrullas Operador", url: "/historial-patrullas-operador", icon: Clock },
          ]
        },
        { 
          category: "📊 Reportes y Análisis", 
          items: [
            { title: "Reportes Generales", url: "/reportes", icon: FileText },
            { title: "Reportes Supervisor", url: "/reportes-supervisor", icon: FileText },
            { title: "Reportes Técnicos", url: "/reportes-tecnicos", icon: FileText },
            { title: "Reporte Detallado", url: "/reporte-detallado", icon: FileText },
            { title: "Todas las Ubicaciones", url: "/ubicaciones", icon: MapPin },
          ]
        }
      ];

    case 'director':
      return [
        { 
          category: "🎯 Panel Director", 
          items: [
            { title: "Dashboard Ejecutivo", url: "/dashboard", icon: Home },
            { title: "Reportes Ejecutivos", url: "/reportes-ejecutivos", icon: BarChart3 },
            { title: "Análisis Avanzado", url: "/analisis", icon: FileText },
            { title: "Estado General", url: "/estado-general", icon: Shield },
          ]
        },
        { 
          category: "👥 Gestión Personal", 
          items: [
            { title: "Gestión Personal Operadores", url: "/personal", icon: Users },
            { title: "Turnos Operador", url: "/turnos-operador", icon: Clock },
            { title: "Turnos Supervisor", url: "/turnos-supervisor", icon: Clock },
          ]
        }
      ];

    case 'operador_alarmas':
      return [
        { 
          category: "🚨 Operaciones", 
          items: [
            { title: "Central de Alarmas", url: "/central-alarmas", icon: AlertTriangle },
            { title: "Generar Alarma", url: "/generar-alarma", icon: Siren },
            { title: "Todas las Alarmas", url: "/alarmas", icon: AlertTriangle },
            { title: "Gestión de Clientes", url: "/gestion-clientes", icon: Users },
            { title: "Turnos Operadores", url: "/turnos-operador", icon: Clock },
          ]
        },
        { 
          category: "📝 Registro", 
          items: [
            { title: "Registro Actividades", url: "/registro-actividades", icon: Clock },
            { title: "Historial Patrullas", url: "/historial-patrullas-operador", icon: Clock },
            { title: "Mis Turnos", url: "/turnos-operador", icon: Clock },
          ]
        }
      ];

    case 'despachador_patrullas':
      return [
        { 
          category: "🚗 Despacho", 
          items: [
            { title: "Dashboard Despachador", url: "/seccion-despachador", icon: BarChart3 },
            { title: "Patrullas Activas", url: "/patrullas-activas", icon: Car },
            { title: "Asignaciones", url: "/asignaciones", icon: MapPin },
          ]
        },
        { 
          category: "🌐 Enlaces Externos", 
          items: [
            { title: "WhatsApp Web", url: "https://web.whatsapp.com/", icon: MessageCircle, external: true },
            { title: "Plataforma de Monitoreo", url: "https://monitoreo.miscuentas24hs.com/", icon: Monitor, external: true },
            { title: "Plataforma GPS FullTrack", url: "https://fultrack.com", icon: Navigation, external: true },
            { title: "Plataforma GPS ProTrack", url: "https://www.protrack365.com/?lang=es-es", icon: Navigation, external: true },
          ]
        },
        { 
          category: "📊 Seguimiento", 
          items: [
            { title: "Historial Patrullas", url: "/historial-patrullas-despachador", icon: Clock },
            { title: "Turnos Supervisores", url: "/turnos-supervisor", icon: Clock },
            { title: "Estado Vehículos", url: "/patrullas", icon: Truck },
          ]
        }
      ];

    case 'supervisor_motorizado':
      return [
        { 
          category: "🚔 Mi Patrulla", 
          items: [
            { title: "Mi Patrulla", url: "/mi-patrulla", icon: Car },
            { title: "Rutas Asignadas", url: "/rutas-asignadas", icon: MapPin },
            { title: "Registro Incidentes", url: "/registro-incidentes", icon: AlertTriangle },
            { title: "Registro Actividades", url: "/registro-actividades", icon: Clock },
          ]
        },
        { 
          category: "📊 Reportes", 
          items: [
            { title: "Reportes Supervisor", url: "/reportes-supervisor", icon: FileText },
            { title: "Mis Turnos", url: "/turnos-supervisor", icon: Clock },
          ]
        }
      ];

    case 'tecnico':
    case 'tecnico_propio':
    case 'tecnico_externo':
      return [
        { 
          category: "🔧 Servicios Técnicos", 
          items: [
            { title: "Mis Servicios", url: "/servicios-tecnicos", icon: Wrench },
            { title: "Inventario", url: "/inventario", icon: Package },
            { title: "Reportes Técnicos", url: "/reportes-tecnicos", icon: FileText },
          ]
        }
      ];

    case 'director_tecnico':
    case 'jefe_tecnicos':
      return [
        { 
          category: "🔧 Gestión Técnica", 
          items: [
            { title: "Servicios Técnicos", url: "/servicios-tecnicos", icon: Wrench },
            { title: "Inventario", url: "/inventario", icon: Package },
            { title: "Ingresar Material", url: "/ingresar-material", icon: Package },
            { title: "Servicios Técnicos", url: "/servicios-tecnicos", icon: Wrench },
          ]
        }
      ];

    case 'asesor_ventas':
      return [
        { 
          category: "💼 Ventas", 
          items: [
            { title: "Gestión Clientes", url: "/clientes", icon: Users },
            { title: "Ingresar Clientes", url: "/ingresar-clientes", icon: UserPlus },
            { title: "Generar Cotizaciones", url: "/generar-cotizaciones", icon: FileSignature },
            { title: "Elementos Cotizables", url: "/elementos-cotizables", icon: DollarSign },
          ]
        }
      ];

    default:
      return [
        { 
          category: "🏠 Principal", 
          items: [
            { title: "Dashboard", url: "/dashboard", icon: Home },
          ]
        }
      ];
  }
};

export function SidebarByRole() {
  const { user, logout } = useAuthConsolidatedContext();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const currentPath = location.pathname;

  if (!user) {
    return null;
  }

  const menuItems = getMenuByRole(user.role as UserRole);

  const handleNavigation = (url: string, external?: boolean) => {
    if (external) {
      window.open(url, '_blank');
    } else if (url !== '#') {
      navigate(url);
    }
  };

  const toggleSection = (category: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const toggleItem = (itemTitle: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemTitle]: !prev[itemTitle]
    }));
  };

  const renderMenuItem = (item: MenuItem, isSubcategory = false) => {
    const isActive = currentPath === item.url;
    const hasSubcategory = item.subcategory && item.subcategory.length > 0;
    const isExpanded = expandedItems[item.title];

    if (hasSubcategory) {
      return (
        <Collapsible key={item.title} open={isExpanded} onOpenChange={() => toggleItem(item.title)}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton 
                className={`w-full flex items-center justify-between hover:bg-accent ${isSubcategory ? 'ml-4' : ''}`}
              >
                <div className="flex items-center">
                  <item.icon className="h-4 w-4 mr-2" />
                  {!collapsed && <span>{item.title}</span>}
                </div>
                {!collapsed && (isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1">
              {item.subcategory?.map((subItem) => (
                <SidebarMenuItem key={subItem.title} className="ml-4">
                  <SidebarMenuButton
                    onClick={() => handleNavigation(subItem.url, subItem.external)}
                    className={`w-full ${currentPath === subItem.url ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                  >
                    <subItem.icon className="h-4 w-4 mr-2" />
                    {!collapsed && <span>{subItem.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          onClick={() => handleNavigation(item.url, item.external)}
          className={`w-full ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'} ${isSubcategory ? 'ml-4' : ''}`}
        >
          <item.icon className="h-4 w-4 mr-2" />
          {!collapsed && <span>{item.title}</span>}
          {item.external && !collapsed && <ExternalLink className="h-3 w-3 ml-auto" />}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-72"}>
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent className="space-y-2">
        {/* User Info */}
        {!collapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items - Específicos por rol */}
        {menuItems.map((category) => {
          const isExpanded = expandedSections[category.category];
          
          return (
            <Collapsible 
              key={category.category} 
              open={isExpanded} 
              onOpenChange={() => toggleSection(category.category)}
            >
              <SidebarGroup>
                <CollapsibleTrigger asChild>
                  <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-3 rounded-md transition-colors">
                    <span className={`text-sm font-medium ${collapsed ? "sr-only" : ""}`}>
                      {category.category}
                    </span>
                    {!collapsed && (
                      isExpanded ? 
                      <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </SidebarGroupLabel>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 mt-1">
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-1">
                      {category.items.map((item) => renderMenuItem(item))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          );
        })}

        {/* Logout Button */}
        <div className="mt-auto p-4 border-t">
          <Button
            onClick={logout}
            variant="outline"
            className="w-full"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Cerrar Sesión</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
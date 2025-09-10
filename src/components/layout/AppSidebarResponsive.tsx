import { useState, useEffect } from "react";
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
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
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

const adminMenuItems: MenuCategory[] = [
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
      { title: "Gestión Personal Operadores", url: "/personal", icon: Users },
      { title: "Turnos Operador", url: "/turnos-operador", icon: Clock },
      { title: "Turnos Supervisor", url: "/turnos-supervisor", icon: Clock },
      { title: "Ingresar Clientes", url: "/ingresar-clientes", icon: UserPlus },
    ]
  },
  { 
    category: "👷 Sección Técnicos",
    items: [
      { 
        title: "Director técnico", 
        url: "/director-tecnico", 
        icon: UserCheck, 
        subcategory: [
          { title: "Director Técnico", url: "/director-tecnico", icon: UserCheck },
        ]
      },
      { 
        title: "Técnico", 
        url: "#", 
        icon: UserCheck, 
        subcategory: [
          { title: "Técnico Propio", url: "/tecnico-propio", icon: UserCheck },
          { title: "Técnico Externo", url: "/tecnico-externo", icon: UserCheck },
        ]
      },
    ]
  },
  { 
    category: "🔧 Mantenimiento", 
    items: [
      { title: "Mantenimiento", url: "/mantenimiento", icon: Wrench },
    ]
  },
  { 
    category: "💼 Sección Ventas", 
    items: [
      { title: "Gestión Clientes", url: "/clientes", icon: Users },
      { title: "Reportes Ventas", url: "/ventas", icon: DollarSign },
      { title: "Generar Cotizaciones", url: "/generar-cotizaciones", icon: FileSignature },
    ]
  },
  { 
    category: "📦 Gestión Inventario", 
    items: [
      { title: "Inventario General", url: "/inventario", icon: Package },
      { title: "Ingresar Material", url: "/ingresar-material", icon: Package },
    ]
  },
  { 
    category: "📊 Monitoreo General", 
    items: [
      { title: "Historial de Alarmas", url: "/alarmas", icon: AlertTriangle },
      { title: "Todas las Patrullas", url: "/patrullas", icon: Car },
      { title: "Todas las Ubicaciones", url: "/ubicaciones", icon: MapPin },
      { title: "Reportes Generales", url: "/reportes", icon: FileText },
    ]
  },
  { 
    category: "🌐 Herramientas Externas", 
    items: [
      { title: "Monitoreo de Alarmas", url: "https://monitoreo.miscuentas24hs.com/", icon: Monitor, external: true },
      { title: "WhatsApp", url: "https://web.whatsapp.com/", icon: MessageCircle, external: true },
      { title: "Fultrack", url: "#", icon: Navigation, external: true },
      { title: "Protrack365", url: "#", icon: Navigation, external: true },
    ]
  },
  { 
    category: "🚨 Despachos", 
    items: [
      { 
        title: "Operador", 
        url: "#", 
        icon: Users, 
        subcategory: [
          { title: "Monitoreo de Alarmas", url: "/central-alarmas", icon: AlertTriangle },
          { title: "Gestión de Clientes", url: "/gestion-clientes", icon: Users },
          { title: "Generar Alarma", url: "/generar-alarma", icon: Siren },
          { title: "Historial de Patrullas", url: "/historial-patrullas-operador", icon: Clock },
          { title: "Turnos Operador", url: "/turnos-operador", icon: Clock },
        ]
      },
      { 
        title: "Despachador", 
        url: "#", 
        icon: Car, 
        subcategory: [
          { title: "Patrullas Activas", url: "/patrullas-activas", icon: Car },
          { title: "Asignaciones", url: "/asignaciones", icon: MapPin },
          { title: "Sección Despachador", url: "/seccion-despachador", icon: Phone },
          { title: "Historial de Patrullas", url: "/historial-patrullas-despachador", icon: Clock },
          { title: "Turnos Supervisor", url: "/turnos-supervisor", icon: Clock },
        ]
      },
      { 
        title: "Supervisor", 
        url: "#", 
        icon: Shield, 
        subcategory: [
          { title: "Mis Asignaciones", url: "/asignaciones", icon: MapPin },
          { title: "Rutas Asignadas", url: "/rutas-asignadas", icon: MapPin },
          { title: "Registro Incidentes", url: "/registro-incidentes", icon: AlertTriangle },
          { title: "Registro Actividades", url: "/registro-actividades", icon: Clock },
        ]
      },
    ]
  }
];

export function AppSidebarResponsive() {
  const { user, logout } = useAuthConsolidated();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const currentPath = location.pathname;

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

  // Solo mostrar menú de administrador
  if (!user || user.role !== 'administrador') {
    return null;
  }

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

        {/* Menu Items - Cada sección como acordeón */}
        {adminMenuItems.map((category) => {
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
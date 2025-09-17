import { useState, useEffect } from "react";
import { 
  Home, 
  Shield, 
  Users, 
  AlertTriangle, 
  Car, 
  Radio, 
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
  History,
  DollarSign,
  UserCheck,
  Target,
  UserPlus,
  FileSignature,
  Package,
  Siren,
  ShieldCheck,
  HardHat,
  TrendingUp,
  ExternalLink,
  Truck,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { useAuthConsolidated } from "@/hooks/useAuthConsolidated";
import { supabase } from "@/integrations/supabase/client";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
      { title: "Patrullas Coraza", url: "/patrullas-coraza", icon: Shield },
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
      { title: "Gestión de Usuarios", url: "/gestion-usuarios-director", icon: Users },
      { title: "Patrullas Coraza", url: "/patrullas-coraza", icon: Shield },
    ]
  },
  { 
    category: "👷 Sección Técnicos",
    items: [
      { title: "Director técnico", url: "/director-tecnico", icon: UserCheck, subcategory: [
        { title: "Director Técnico", url: "/director-tecnico", icon: UserCheck },
      ]},
      { title: "Técnico", url: "#", icon: UserCheck, subcategory: [
        { title: "Técnico Propio", url: "/tecnico-propio", icon: UserCheck },
        { title: "Técnico Externo", url: "/tecnico-externo", icon: UserCheck },
      ]},
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
      { title: "Operador", url: "#", icon: Users, subcategory: [
        { title: "Monitoreo de Alarmas", url: "/central-alarmas", icon: AlertTriangle },
        { title: "Gestión de Clientes", url: "/gestion-clientes", icon: Users },
        { title: "Generar Alarma", url: "/generar-alarma", icon: Siren },
        { title: "Historial de Patrullas", url: "/historial-patrullas-operador", icon: Clock },
        { title: "Turnos Operador", url: "/turnos-operador", icon: Clock },
      ]},
        { title: "Despachador", url: "#", icon: Car, subcategory: [
          { title: "Alarmas Activas", url: "/patrullas-activas", icon: Car },
          { title: "Historial de Servicios", url: "/historial-servicios", icon: History },
          { title: "Asignaciones", url: "/asignaciones", icon: MapPin },
          { title: "Sección Despachador", url: "/seccion-despachador", icon: Phone },
          { title: "Historial de Patrullas", url: "/historial-patrullas-despachador", icon: Clock },
          { title: "Turnos Supervisor", url: "/turnos-supervisor", icon: Clock },
        ]},
      { title: "Supervisor", url: "#", icon: Shield, subcategory: [
        { title: "Rutas Asignadas", url: "/rutas-asignadas", icon: MapPin },
        { title: "Registro Incidentes", url: "/registro-incidentes", icon: AlertTriangle },
        { title: "Registro Actividades", url: "/registro-actividades", icon: Clock },
      ]},
    ]
  }
];

export function AppSidebarAdmin() {
  const { user, logout } = useAuthConsolidated();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const currentPath = location.pathname;

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemTitle)) {
        newSet.delete(itemTitle);
      } else {
        newSet.add(itemTitle);
      }
      return newSet;
    });
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.external) {
      window.open(item.url, '_blank');
      return;
    }
    
    if (item.subcategory && item.subcategory.length > 0) {
      toggleExpanded(item.title);
      return;
    }
    
    if (item.url !== '#') {
      navigate(item.url);
    }
  };

  const renderMenuItem = (item: MenuItem, index: number, depth: number = 0) => {
    const isActive = currentPath === item.url;
    const isExpanded = expandedItems.has(item.title);
    const hasSubItems = item.subcategory && item.subcategory.length > 0;
    const IconComponent = item.icon;

    return (
      <div key={`${item.title}-${index}`}>
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={() => handleItemClick(item)}
            className={`w-full text-left transition-colors ${
              isActive ? 'bg-accent text-accent-foreground' : ''
            } ${depth > 0 ? 'pl-8' : ''}`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className={collapsed ? "sr-only" : ""}>{item.title}</span>
              </div>
              {hasSubItems && !collapsed && (
                isExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
        
        {hasSubItems && isExpanded && !collapsed && (
          <div className="ml-4">
            {item.subcategory!.map((subItem, subIndex) => 
              renderMenuItem(subItem, subIndex, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <Sidebar variant="inset" side="left" collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 p-4 border-b">
          <Shield className="h-6 w-6 text-primary" />
          <span className={`font-bold text-lg ${collapsed ? "sr-only" : ""}`}>
            HALCON Admin
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          {adminMenuItems.map((category, categoryIndex) => (
            <SidebarGroup key={categoryIndex}>
              <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
                {category.category}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items.map((item, itemIndex) => 
                    renderMenuItem(item, itemIndex)
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </div>

        <div className="border-t p-4">
          <div className="flex items-center gap-2 mb-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div className={collapsed ? "sr-only" : ""}>
              <p className="font-medium">{user?.full_name || 'Usuario'}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {user?.role || 'Sin rol'}
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className={`w-full justify-start ${collapsed ? 'px-2' : ''}`}
            >
              <LogOut className="h-4 w-4" />
              <span className={collapsed ? "sr-only" : "ml-2"}>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
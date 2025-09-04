import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarTurnos } from "@/components/turnos/CalendarTurnos";
import { Plus, Calendar, Users, Clock } from "lucide-react";

const TurnosOperador = () => {
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold">Turnos Operador - Vista General</h1>
          <p className="text-sm text-muted-foreground">
            Visualización de turnos programados para operadores (Solo consulta)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md w-fit">
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">Solo visualización</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnos Programados</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">Esta semana</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operadores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Personal disponible</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Cubiertas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98%</div>
            <p className="text-xs text-muted-foreground">Cobertura semanal</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendario Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Calendario de Turnos - Semana Actual</CardTitle>
          <CardDescription>
            Vista general de los turnos asignados para la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Leyenda de turnos */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Mañana (06:00-14:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span>Tarde (14:00-22:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Noche (18:00-06:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Día Completo (06:00-18:00)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span>Descanso</span>
                  </div>
                </div>

            {/* Tabla de empleados y turnos */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Empleado</th>
                    <th className="text-center p-3 font-medium">Lun<br/><span className="text-xs text-muted-foreground">1</span></th>
                    <th className="text-center p-3 font-medium">Mar<br/><span className="text-xs text-muted-foreground">2</span></th>
                    <th className="text-center p-3 font-medium">Mié<br/><span className="text-xs text-muted-foreground">3</span></th>
                    <th className="text-center p-3 font-medium">Jue<br/><span className="text-xs text-muted-foreground">4</span></th>
                    <th className="text-center p-3 font-medium">Vie<br/><span className="text-xs text-muted-foreground">5</span></th>
                    <th className="text-center p-3 font-medium">Sáb<br/><span className="text-xs text-muted-foreground">6</span></th>
                    <th className="text-center p-3 font-medium">Dom<br/><span className="text-xs text-muted-foreground">7</span></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Juan Pérez - Operador */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          JP
                        </div>
                        <div>
                          <p className="font-medium">Juan Pérez</p>
                          <p className="text-xs text-muted-foreground">Operador</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                    </td>
                  </tr>

                  {/* María García - Operador */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          MG
                        </div>
                        <div>
                          <p className="font-medium">María García</p>
                          <p className="text-xs text-muted-foreground">Operador</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                    </td>
                  </tr>

                  {/* Carlos López - Operador */}
                  <tr className="border-b hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium">
                          CL
                        </div>
                        <div>
                          <p className="font-medium">Carlos López</p>
                          <p className="text-xs text-muted-foreground">Operador</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-yellow-500 text-white text-xs p-2 rounded">Día</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-purple-500 text-white text-xs p-2 rounded">Noche</div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="bg-red-500 text-white text-xs p-2 rounded">Descanso</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TurnosOperador;
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ClienteServiciosDisplay } from '@/components/alarmas/ClienteServiciosDisplay';

interface Cliente {
  id: string;
  nombre: string;
  numero_cuenta?: string;
  direccion?: string;
}

interface ClienteSelectorProps {
  clientes: Cliente[];
  selectedClienteId: string;
  onClienteChange: (clienteId: string) => void;
  showServiciosDisplay?: boolean;
}

export const ClienteSelector: React.FC<ClienteSelectorProps> = ({
  clientes,
  selectedClienteId,
  onClienteChange,
  showServiciosDisplay = true
}) => {
  const selectedCliente = clientes.find(c => c.id === selectedClienteId);

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="cliente">Cliente</Label>
        <Select value={selectedClienteId} onValueChange={onClienteChange}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccione un cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((cliente) => (
              <SelectItem key={cliente.id} value={cliente.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{cliente.nombre}</span>
                  {cliente.numero_cuenta && (
                    <span className="text-sm text-muted-foreground">
                      {cliente.numero_cuenta}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mostrar información de servicios si hay cliente seleccionado */}
      {showServiciosDisplay && selectedClienteId && selectedCliente && (
        <ClienteServiciosDisplay 
          clienteId={selectedClienteId}
          clienteNombre={selectedCliente.nombre}
        />
      )}
    </div>
  );
};
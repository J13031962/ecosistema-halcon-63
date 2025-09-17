export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      alarma_tiempos: {
        Row: {
          alarma_id: string
          created_at: string
          detalles: Json | null
          evento_tipo: string
          id: string
          timestamp_evento: string
          usuario_id: string | null
          usuario_nombre: string | null
        }
        Insert: {
          alarma_id: string
          created_at?: string
          detalles?: Json | null
          evento_tipo: string
          id?: string
          timestamp_evento?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Update: {
          alarma_id?: string
          created_at?: string
          detalles?: Json | null
          evento_tipo?: string
          id?: string
          timestamp_evento?: string
          usuario_id?: string | null
          usuario_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alarma_tiempos_alarma_id_fkey"
            columns: ["alarma_id"]
            isOneToOne: false
            referencedRelation: "alarmas"
            referencedColumns: ["id"]
          },
        ]
      }
      alarmas: {
        Row: {
          attended_at: string | null
          cliente_id: string | null
          created_at: string | null
          descripcion: string | null
          despachador_id: string | null
          despachador_nombre: string | null
          direccion: string | null
          duracion_sitio_segundos: number | null
          estado: string | null
          id: string
          municipio: string | null
          observaciones_count: number | null
          operador_id: string | null
          operador_nombre: string | null
          patrulla_asignada: string | null
          prioridad: string | null
          qr_llegada_data: Json | null
          qr_salida_data: Json | null
          resolved_at: string | null
          supervisor: string | null
          supervisor_id: string | null
          supervisor_llegada: string | null
          supervisor_salida: string | null
          tiempo_aceptacion_supervisor: string | null
          tiempo_asignacion: string | null
          tiempo_asignacion_supervisor: string | null
          tiempo_atencion: string | null
          tiempo_llegada_sitio: string | null
          tiempo_primera_lectura_qr: string | null
          tiempo_respuesta_segundos: number | null
          tiempo_salida_sitio: string | null
          tiempo_segunda_lectura_qr: string | null
          tiempo_toma_despachador: string | null
          tipo: string
          ubicacion_primer_qr: string | null
          ubicacion_segundo_qr: string | null
        }
        Insert: {
          attended_at?: string | null
          cliente_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          despachador_id?: string | null
          despachador_nombre?: string | null
          direccion?: string | null
          duracion_sitio_segundos?: number | null
          estado?: string | null
          id?: string
          municipio?: string | null
          observaciones_count?: number | null
          operador_id?: string | null
          operador_nombre?: string | null
          patrulla_asignada?: string | null
          prioridad?: string | null
          qr_llegada_data?: Json | null
          qr_salida_data?: Json | null
          resolved_at?: string | null
          supervisor?: string | null
          supervisor_id?: string | null
          supervisor_llegada?: string | null
          supervisor_salida?: string | null
          tiempo_aceptacion_supervisor?: string | null
          tiempo_asignacion?: string | null
          tiempo_asignacion_supervisor?: string | null
          tiempo_atencion?: string | null
          tiempo_llegada_sitio?: string | null
          tiempo_primera_lectura_qr?: string | null
          tiempo_respuesta_segundos?: number | null
          tiempo_salida_sitio?: string | null
          tiempo_segunda_lectura_qr?: string | null
          tiempo_toma_despachador?: string | null
          tipo: string
          ubicacion_primer_qr?: string | null
          ubicacion_segundo_qr?: string | null
        }
        Update: {
          attended_at?: string | null
          cliente_id?: string | null
          created_at?: string | null
          descripcion?: string | null
          despachador_id?: string | null
          despachador_nombre?: string | null
          direccion?: string | null
          duracion_sitio_segundos?: number | null
          estado?: string | null
          id?: string
          municipio?: string | null
          observaciones_count?: number | null
          operador_id?: string | null
          operador_nombre?: string | null
          patrulla_asignada?: string | null
          prioridad?: string | null
          qr_llegada_data?: Json | null
          qr_salida_data?: Json | null
          resolved_at?: string | null
          supervisor?: string | null
          supervisor_id?: string | null
          supervisor_llegada?: string | null
          supervisor_salida?: string | null
          tiempo_aceptacion_supervisor?: string | null
          tiempo_asignacion?: string | null
          tiempo_asignacion_supervisor?: string | null
          tiempo_atencion?: string | null
          tiempo_llegada_sitio?: string | null
          tiempo_primera_lectura_qr?: string | null
          tiempo_respuesta_segundos?: number | null
          tiempo_salida_sitio?: string | null
          tiempo_segunda_lectura_qr?: string | null
          tiempo_toma_despachador?: string | null
          tipo?: string
          ubicacion_primer_qr?: string | null
          ubicacion_segundo_qr?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alarmas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string | null
          direccion: string | null
          email: string | null
          estado: string | null
          fecha_contrato: string | null
          id: string
          latitud: number | null
          longitud: number | null
          municipio: string | null
          nombre: string
          numero_cuenta: string | null
          observaciones: string | null
          servicios_contratados: Json | null
          telefono: string | null
          tipo_servicio: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          fecha_contrato?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          municipio?: string | null
          nombre: string
          numero_cuenta?: string | null
          observaciones?: string | null
          servicios_contratados?: Json | null
          telefono?: string | null
          tipo_servicio?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          direccion?: string | null
          email?: string | null
          estado?: string | null
          fecha_contrato?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          municipio?: string | null
          nombre?: string
          numero_cuenta?: string | null
          observaciones?: string | null
          servicios_contratados?: Json | null
          telefono?: string | null
          tipo_servicio?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cotizacion_items: {
        Row: {
          cantidad: number
          cotizacion_id: string
          created_at: string
          descripcion: string
          id: string
          precio_unitario: number
          total: number
        }
        Insert: {
          cantidad?: number
          cotizacion_id: string
          created_at?: string
          descripcion: string
          id?: string
          precio_unitario?: number
          total?: number
        }
        Update: {
          cantidad?: number
          cotizacion_id?: string
          created_at?: string
          descripcion?: string
          id?: string
          precio_unitario?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "cotizacion_items_cotizacion_id_fkey"
            columns: ["cotizacion_id"]
            isOneToOne: false
            referencedRelation: "cotizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      cotizaciones: {
        Row: {
          cliente_id: string | null
          cliente_nombre: string
          created_at: string
          descuento: number
          estado: string
          fecha_expiracion: string
          id: string
          numero_cotizacion: string
          subtotal: number
          terminos_pago: string | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          cliente_nombre: string
          created_at?: string
          descuento?: number
          estado?: string
          fecha_expiracion: string
          id?: string
          numero_cotizacion: string
          subtotal?: number
          terminos_pago?: string | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          cliente_nombre?: string
          created_at?: string
          descuento?: number
          estado?: string
          fecha_expiracion?: string
          id?: string
          numero_cotizacion?: string
          subtotal?: number
          terminos_pago?: string | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotizaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      elementos_cotizables: {
        Row: {
          categoria: string
          codigo: string
          created_at: string
          descripcion: string
          estado: string
          id: string
          nombre: string
          observaciones: string | null
          precio: number
          unidad: string
          updated_at: string
        }
        Insert: {
          categoria: string
          codigo: string
          created_at?: string
          descripcion: string
          estado?: string
          id?: string
          nombre: string
          observaciones?: string | null
          precio?: number
          unidad: string
          updated_at?: string
        }
        Update: {
          categoria?: string
          codigo?: string
          created_at?: string
          descripcion?: string
          estado?: string
          id?: string
          nombre?: string
          observaciones?: string | null
          precio?: number
          unidad?: string
          updated_at?: string
        }
        Relationships: []
      }
      estados_patrulla: {
        Row: {
          alarma_id: string
          created_at: string
          duracion_segundos: number | null
          estado: string
          id: string
          supervisor_id: string | null
          supervisor_nombre: string | null
          tiempo_fin: string | null
          tiempo_inicio: string | null
          updated_at: string
        }
        Insert: {
          alarma_id: string
          created_at?: string
          duracion_segundos?: number | null
          estado?: string
          id?: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
          updated_at?: string
        }
        Update: {
          alarma_id?: string
          created_at?: string
          duracion_segundos?: number | null
          estado?: string
          id?: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          tiempo_fin?: string | null
          tiempo_inicio?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eventos_sistema: {
        Row: {
          created_at: string | null
          descripcion: string
          id: string
          tipo_evento: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          id?: string
          tipo_evento: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          id?: string
          tipo_evento?: string
          user_id?: string | null
        }
        Relationships: []
      }
      historial_patrullas_despachador: {
        Row: {
          actividad: string
          created_at: string
          duracion_minutos: number | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          patrulla_numero: string
          supervisor_nombre: string | null
          ubicacion: string | null
        }
        Insert: {
          actividad: string
          created_at?: string
          duracion_minutos?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          patrulla_numero: string
          supervisor_nombre?: string | null
          ubicacion?: string | null
        }
        Update: {
          actividad?: string
          created_at?: string
          duracion_minutos?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          patrulla_numero?: string
          supervisor_nombre?: string | null
          ubicacion?: string | null
        }
        Relationships: []
      }
      historial_patrullas_operador: {
        Row: {
          actividad: string
          created_at: string
          duracion_minutos: number | null
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          patrulla_numero: string
          supervisor_nombre: string | null
          ubicacion: string | null
        }
        Insert: {
          actividad: string
          created_at?: string
          duracion_minutos?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          patrulla_numero: string
          supervisor_nombre?: string | null
          ubicacion?: string | null
        }
        Update: {
          actividad?: string
          created_at?: string
          duracion_minutos?: number | null
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          patrulla_numero?: string
          supervisor_nombre?: string | null
          ubicacion?: string | null
        }
        Relationships: []
      }
      incidentes: {
        Row: {
          created_at: string
          descripcion: string
          estado: string | null
          gravedad: string | null
          id: string
          resolved_at: string | null
          supervisor_id: string | null
          supervisor_nombre: string | null
          tipo_incidente: string
          ubicacion: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: string | null
          gravedad?: string | null
          id?: string
          resolved_at?: string | null
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          tipo_incidente: string
          ubicacion?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string | null
          gravedad?: string | null
          id?: string
          resolved_at?: string | null
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          tipo_incidente?: string
          ubicacion?: string | null
        }
        Relationships: []
      }
      llamadas_clientes: {
        Row: {
          cliente_id: string
          contacto_nombre: string
          created_at: string
          duracion_segundos: number | null
          estado: string | null
          id: string
          motivo: string | null
          numero_telefono: string
          observaciones: string | null
          operador_id: string | null
          tipo_llamada: string
        }
        Insert: {
          cliente_id: string
          contacto_nombre: string
          created_at?: string
          duracion_segundos?: number | null
          estado?: string | null
          id?: string
          motivo?: string | null
          numero_telefono: string
          observaciones?: string | null
          operador_id?: string | null
          tipo_llamada: string
        }
        Update: {
          cliente_id?: string
          contacto_nombre?: string
          created_at?: string
          duracion_segundos?: number | null
          estado?: string | null
          id?: string
          motivo?: string | null
          numero_telefono?: string
          observaciones?: string | null
          operador_id?: string | null
          tipo_llamada?: string
        }
        Relationships: []
      }
      minuta_operaciones: {
        Row: {
          contenido: string
          created_at: string
          id: string
          prioridad: string | null
          tipo_entrada: string
          turno: string | null
          usuario_id: string | null
          usuario_nombre: string
        }
        Insert: {
          contenido: string
          created_at?: string
          id?: string
          prioridad?: string | null
          tipo_entrada?: string
          turno?: string | null
          usuario_id?: string | null
          usuario_nombre: string
        }
        Update: {
          contenido?: string
          created_at?: string
          id?: string
          prioridad?: string | null
          tipo_entrada?: string
          turno?: string | null
          usuario_id?: string | null
          usuario_nombre?: string
        }
        Relationships: []
      }
      observaciones_alarmas: {
        Row: {
          alarma_id: string
          created_at: string
          id: string
          observacion: string
          supervisor_id: string
          supervisor_nombre: string
        }
        Insert: {
          alarma_id: string
          created_at?: string
          id?: string
          observacion: string
          supervisor_id: string
          supervisor_nombre: string
        }
        Update: {
          alarma_id?: string
          created_at?: string
          id?: string
          observacion?: string
          supervisor_id?: string
          supervisor_nombre?: string
        }
        Relationships: []
      }
      observaciones_servicios_tecnicos: {
        Row: {
          created_at: string
          id: string
          observacion: string
          servicio_id: string
          tecnico_id: string
          tipo_observacion: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          observacion: string
          servicio_id: string
          tecnico_id: string
          tipo_observacion?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          observacion?: string
          servicio_id?: string
          tecnico_id?: string
          tipo_observacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "observaciones_servicios_tecnicos_servicio_id_fkey"
            columns: ["servicio_id"]
            isOneToOne: false
            referencedRelation: "servicios_tecnicos_asignados"
            referencedColumns: ["id"]
          },
        ]
      }
      operaciones_diarias: {
        Row: {
          created_at: string | null
          efectividad_porcentaje: number | null
          fecha: string
          id: string
          ingresos_dia: number | null
          tiempo_respuesta_promedio: number | null
        }
        Insert: {
          created_at?: string | null
          efectividad_porcentaje?: number | null
          fecha: string
          id?: string
          ingresos_dia?: number | null
          tiempo_respuesta_promedio?: number | null
        }
        Update: {
          created_at?: string | null
          efectividad_porcentaje?: number | null
          fecha?: string
          id?: string
          ingresos_dia?: number | null
          tiempo_respuesta_promedio?: number | null
        }
        Relationships: []
      }
      patrullas: {
        Row: {
          created_at: string | null
          estado: string | null
          id: string
          numero_patrulla: string
          supervisor_id: string | null
          supervisor_nombre: string | null
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          estado?: string | null
          id?: string
          numero_patrulla: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          estado?: string | null
          id?: string
          numero_patrulla?: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      patrullas_coraza: {
        Row: {
          acompanamientos_disponibles: number
          acompanamientos_usados: number
          cliente_id: string | null
          created_at: string
          id: string
          month: number
          patrullas_disponibles: number
          patrullas_usadas: number
          revistas_disponibles: number
          revistas_usadas: number
          updated_at: string
          year: number
        }
        Insert: {
          acompanamientos_disponibles?: number
          acompanamientos_usados?: number
          cliente_id?: string | null
          created_at?: string
          id?: string
          month?: number
          patrullas_disponibles?: number
          patrullas_usadas?: number
          revistas_disponibles?: number
          revistas_usadas?: number
          updated_at?: string
          year?: number
        }
        Update: {
          acompanamientos_disponibles?: number
          acompanamientos_usados?: number
          cliente_id?: string | null
          created_at?: string
          id?: string
          month?: number
          patrullas_disponibles?: number
          patrullas_usadas?: number
          revistas_disponibles?: number
          revistas_usadas?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "patrullas_coraza_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      personal: {
        Row: {
          cargo: string | null
          created_at: string | null
          estado: string | null
          id: string
          nombre: string
          turno: string | null
          user_id: string | null
        }
        Insert: {
          cargo?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre: string
          turno?: string | null
          user_id?: string | null
        }
        Update: {
          cargo?: string | null
          created_at?: string | null
          estado?: string | null
          id?: string
          nombre?: string
          turno?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          foto_url: string | null
          full_name: string | null
          id: string
          last_login: string | null
          numero_documento: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          foto_url?: string | null
          full_name?: string | null
          id: string
          last_login?: string | null
          numero_documento?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          foto_url?: string | null
          full_name?: string | null
          id?: string
          last_login?: string | null
          numero_documento?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      servicios_tecnicos: {
        Row: {
          cliente_id: string | null
          completed_at: string | null
          created_at: string | null
          descripcion: string | null
          estado: string | null
          id: string
          tecnico_id: string | null
          tipo_servicio: string | null
        }
        Insert: {
          cliente_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          tecnico_id?: string | null
          tipo_servicio?: string | null
        }
        Update: {
          cliente_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          descripcion?: string | null
          estado?: string | null
          id?: string
          tecnico_id?: string | null
          tipo_servicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servicios_tecnicos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      servicios_tecnicos_asignados: {
        Row: {
          cliente_direccion: string
          cliente_email: string | null
          cliente_id: string
          cliente_razon_social: string
          cliente_telefono: string | null
          costo_estimado: number | null
          created_at: string
          descripcion_detallada: string | null
          estado: string
          fecha_aceptacion: string | null
          fecha_asignacion: string
          fecha_finalizacion: string | null
          fecha_inicio: string | null
          firma_cliente: string | null
          firma_tecnico: string | null
          id: string
          materiales_utilizados: Json | null
          motivo_servicio: string
          observaciones_tecnico: string | null
          persona_encargada: string
          prioridad: string
          tecnico_id: string | null
          tecnico_tipo: string | null
          tiempo_estimado_horas: number | null
          tipo_servicio: string
          updated_at: string
        }
        Insert: {
          cliente_direccion: string
          cliente_email?: string | null
          cliente_id: string
          cliente_razon_social: string
          cliente_telefono?: string | null
          costo_estimado?: number | null
          created_at?: string
          descripcion_detallada?: string | null
          estado?: string
          fecha_aceptacion?: string | null
          fecha_asignacion?: string
          fecha_finalizacion?: string | null
          fecha_inicio?: string | null
          firma_cliente?: string | null
          firma_tecnico?: string | null
          id?: string
          materiales_utilizados?: Json | null
          motivo_servicio: string
          observaciones_tecnico?: string | null
          persona_encargada: string
          prioridad?: string
          tecnico_id?: string | null
          tecnico_tipo?: string | null
          tiempo_estimado_horas?: number | null
          tipo_servicio?: string
          updated_at?: string
        }
        Update: {
          cliente_direccion?: string
          cliente_email?: string | null
          cliente_id?: string
          cliente_razon_social?: string
          cliente_telefono?: string | null
          costo_estimado?: number | null
          created_at?: string
          descripcion_detallada?: string | null
          estado?: string
          fecha_aceptacion?: string | null
          fecha_asignacion?: string
          fecha_finalizacion?: string | null
          fecha_inicio?: string | null
          firma_cliente?: string | null
          firma_tecnico?: string | null
          id?: string
          materiales_utilizados?: Json | null
          motivo_servicio?: string
          observaciones_tecnico?: string | null
          persona_encargada?: string
          prioridad?: string
          tecnico_id?: string | null
          tecnico_tipo?: string | null
          tiempo_estimado_horas?: number | null
          tipo_servicio?: string
          updated_at?: string
        }
        Relationships: []
      }
      servicios_utilizados: {
        Row: {
          alarma_id: string
          cliente_id: string
          created_at: string
          fecha_uso: string
          id: string
          month: number
          operador_id: string | null
          operador_nombre: string | null
          tipo_alarma: string
          tipo_servicio: string
          year: number
        }
        Insert: {
          alarma_id: string
          cliente_id: string
          created_at?: string
          fecha_uso?: string
          id?: string
          month?: number
          operador_id?: string | null
          operador_nombre?: string | null
          tipo_alarma: string
          tipo_servicio: string
          year?: number
        }
        Update: {
          alarma_id?: string
          cliente_id?: string
          created_at?: string
          fecha_uso?: string
          id?: string
          month?: number
          operador_id?: string | null
          operador_nombre?: string | null
          tipo_alarma?: string
          tipo_servicio?: string
          year?: number
        }
        Relationships: []
      }
      supervisor_actividades: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          supervisor_id: string | null
          supervisor_nombre: string | null
          tipo_actividad: string
          ubicacion: string | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          tipo_actividad: string
          ubicacion?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          tipo_actividad?: string
          ubicacion?: string | null
        }
        Relationships: []
      }
      turnos_cambios: {
        Row: {
          changed_by: string | null
          changed_by_nombre: string | null
          created_at: string
          descripcion: string | null
          detalles: Json | null
          fecha: string
          id: string
          turno_id: string | null
          turno_tipo: string
          usuario_afectado_id: string | null
          usuario_afectado_nombre: string | null
        }
        Insert: {
          changed_by?: string | null
          changed_by_nombre?: string | null
          created_at?: string
          descripcion?: string | null
          detalles?: Json | null
          fecha: string
          id?: string
          turno_id?: string | null
          turno_tipo?: string
          usuario_afectado_id?: string | null
          usuario_afectado_nombre?: string | null
        }
        Update: {
          changed_by?: string | null
          changed_by_nombre?: string | null
          created_at?: string
          descripcion?: string | null
          detalles?: Json | null
          fecha?: string
          id?: string
          turno_id?: string | null
          turno_tipo?: string
          usuario_afectado_id?: string | null
          usuario_afectado_nombre?: string | null
        }
        Relationships: []
      }
      turnos_operador: {
        Row: {
          created_at: string | null
          fecha: string
          horario_fin: string | null
          horario_inicio: string | null
          id: string
          operador_id: string | null
          operador_nombre: string | null
          turno: string
        }
        Insert: {
          created_at?: string | null
          fecha: string
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          operador_id?: string | null
          operador_nombre?: string | null
          turno: string
        }
        Update: {
          created_at?: string | null
          fecha?: string
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          operador_id?: string | null
          operador_nombre?: string | null
          turno?: string
        }
        Relationships: []
      }
      turnos_supervisor: {
        Row: {
          created_at: string | null
          fecha: string
          horario_fin: string | null
          horario_inicio: string | null
          id: string
          supervisor_id: string | null
          supervisor_nombre: string | null
          turno: string
        }
        Insert: {
          created_at?: string | null
          fecha: string
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          turno: string
        }
        Update: {
          created_at?: string | null
          fecha?: string
          horario_fin?: string | null
          horario_inicio?: string | null
          id?: string
          supervisor_id?: string | null
          supervisor_nombre?: string | null
          turno?: string
        }
        Relationships: []
      }
      user_additional_permissions: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          permission_description: string | null
          permission_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_description?: string | null
          permission_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          permission_description?: string | null
          permission_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string | null
          function_key: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          function_key: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          function_key?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string | null
        }
        Relationships: []
      }
      users_auth: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          password: string
          role: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password: string
          role: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_role_safely: {
        Args: {
          target_email: string
          target_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      can_manage_user_roles: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      emergency_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      emergency_admin_check: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      ensure_supervisor_data_integrity: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      fix_users_without_roles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_cliente_servicios_mes: {
        Args: {
          cliente_id_param: string
          month_param?: number
          year_param?: number
        }
        Returns: {
          acompanamientos_disponibles: number
          acompanamientos_restantes: number
          acompanamientos_usados: number
          patrullas_disponibles: number
          patrullas_restantes: number
          patrullas_usadas: number
          revistas_disponibles: number
          revistas_restantes: number
          revistas_usadas: number
        }[]
      }
      get_consolidated_user_data: {
        Args: { user_email: string }
        Returns: {
          active: boolean
          auth_source: string
          email: string
          full_name: string
          id: string
          role: string
        }[]
      }
      get_historial_servicios_utilizados: {
        Args: { month_param?: number; year_param?: number }
        Returns: {
          cliente_nombre: string
          cliente_numero_cuenta: string
          fecha_uso: string
          id: string
          operador_nombre: string
          tipo_alarma: string
          tipo_servicio: string
        }[]
      }
      get_monthly_comparisons: {
        Args: Record<PropertyKey, never>
        Returns: {
          alarmas_resueltas: number
          alarmas_total: number
          clientes_nuevos: number
          ingresos_estimados: number
          month: string
          servicios_tecnicos: number
        }[]
      }
      get_service_tech_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          completados: number
          costo_total_estimado: number
          en_proceso: number
          pendientes: number
          tiempo_promedio_resolucion: number
        }[]
      }
      get_servicios_globales_mes: {
        Args: { month_param?: number; year_param?: number }
        Returns: {
          acompanamientos_disponibles: number
          acompanamientos_restantes: number
          acompanamientos_usados: number
          patrullas_disponibles: number
          patrullas_restantes: number
          patrullas_usadas: number
          revistas_disponibles: number
          revistas_restantes: number
          revistas_usadas: number
        }[]
      }
      get_top_clients_consumption: {
        Args: Record<PropertyKey, never>
        Returns: {
          cliente_nombre: string
          score: number
          total_alarmas: number
          total_servicios: number
        }[]
      }
      get_user_roles: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string | null
        }[]
      }
      has_permission: {
        Args: { permission_key: string; target_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_user_access_to_data: {
        Args: { record_id: string; table_name: string; user_id: string }
        Returns: boolean
      }
      is_admin_email: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_or_same_user: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      is_authenticated_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_has_role: {
        Args: { check_role: string; check_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role:
        | "administrador"
        | "director"
        | "operador_alarmas"
        | "despachador_patrullas"
        | "supervisor_motorizado"
        | "tecnico"
        | "jefe_tecnicos"
        | "asesor_ventas"
        | "tecnico_propio"
        | "tecnico_externo"
        | "director_tecnico"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: [
        "administrador",
        "director",
        "operador_alarmas",
        "despachador_patrullas",
        "supervisor_motorizado",
        "tecnico",
        "jefe_tecnicos",
        "asesor_ventas",
        "tecnico_propio",
        "tecnico_externo",
        "director_tecnico",
      ],
    },
  },
} as const

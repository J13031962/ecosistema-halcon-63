import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: string;
  numeroDocumento?: string;
  fotoUrl?: string;
}

interface DeleteUserRequest {
  userId: string;
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Check if this is a delete request
    if (body.action === 'delete') {
      const { userId, email }: DeleteUserRequest = body;
      console.log('🗑️ Eliminando usuario con Admin API:', { userId, email });
      
      // Create Supabase Admin client
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Delete user from auth.users
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (deleteError) {
        console.error('❌ Error deleting user from auth:', deleteError);
        throw deleteError;
      }

      console.log('✅ Usuario eliminado completamente del sistema auth');

      // Also delete from profiles table
      const { error: profileDeleteError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileDeleteError) {
        console.error('❌ Error deleting profile:', profileDeleteError);
        // Don't throw here, auth deletion is more important
      } else {
        console.log('✅ Perfil eliminado de la base de datos');
      }

      // Delete user roles
      const { error: rolesDeleteError } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (rolesDeleteError) {
        console.error('❌ Error deleting user roles:', rolesDeleteError);
        // Don't throw here
      } else {
        console.log('✅ Roles eliminados de la base de datos');
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Usuario eliminado completamente del sistema'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Otherwise, proceed with user creation
    const { email, password, fullName, role, numeroDocumento, fotoUrl }: CreateUserRequest = body;
    const requestingUserId = req.headers.get('x-user-id'); // ID del usuario que crea (despachador)
    console.log('🚀 Creando usuario con Admin API:', { email, role, requestingUserId });

    // Create Supabase Admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create user using Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    });

    if (authError) {
      console.error('❌ Error creating user:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('No user data returned');
    }

    console.log('✅ Usuario creado en Auth:', authData.user.id);

    // Si es un supervisor y hay un usuario creador, heredar su empresa
    let empresaContratadaId = null;
    if (role === 'supervisor_motorizado' && requestingUserId) {
      const { data: creadorData } = await supabaseAdmin
        .from('profiles')
        .select('empresa_contratada_id')
        .eq('id', requestingUserId)
        .single();
      
      if (creadorData?.empresa_contratada_id) {
        empresaContratadaId = creadorData.empresa_contratada_id;
        console.log('✅ Heredando empresa del despachador:', empresaContratadaId);
      }
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        user_id: authData.user.id,
        email: email,
        full_name: fullName,
        numero_documento: numeroDocumento,
        foto_url: fotoUrl,
        active: true,
        empresa_contratada_id: empresaContratadaId
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      // Don't throw here, try to assign role anyway
    } else {
      console.log('✅ Perfil creado exitosamente con empresa:', empresaContratadaId);
    }

    // Assign role using the safe function
    const { data: roleResult, error: roleError } = await supabaseAdmin.rpc('assign_user_role_safely', {
      target_email: email,
      target_role: role
    });

    if (roleError) {
      console.error('❌ Error assigning role:', roleError);
      throw roleError;
    }

    console.log('✅ Rol asignado exitosamente:', role);

    return new Response(JSON.stringify({ 
      success: true, 
      user: authData.user,
      message: 'Usuario creado exitosamente'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('💥 Error en admin-create-user:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json', 
        ...corsHeaders 
      },
    });
  }
};

serve(handler);
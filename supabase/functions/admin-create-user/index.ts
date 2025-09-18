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

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, fullName, role, numeroDocumento, fotoUrl }: CreateUserRequest = await req.json();

    console.log('🚀 Creando usuario con Admin API:', { email, role });

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
        active: true
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError);
      // Don't throw here, try to assign role anyway
    } else {
      console.log('✅ Perfil creado exitosamente');
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
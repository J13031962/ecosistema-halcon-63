import { useState, useEffect } from 'react';
import { useAuthConsolidated } from '@/hooks/useAuthConsolidated';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Eye, EyeOff, Home } from 'lucide-react';
import { LoginFormData } from '@/types/auth';

const Login = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState('/lovable-uploads/b189fbe2-9643-4103-bb16-bf1857b39c78.png');
  
  const { login } = useAuthConsolidated();
  const navigate = useNavigate();

  useEffect(() => {
    // Cargar imagen de fondo desde localStorage
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      setError('Error al iniciar sesión. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background p-4" data-page="login">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      
      {/* Dark overlay for better readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Back to Home Button */}
      <Button
        onClick={() => navigate('/')}
        variant="outline"
        size="sm"
        className="absolute top-6 left-6 z-20 bg-white/10 border-white/20 text-white hover:bg-white/20"
      >
        <Home className="h-4 w-4 mr-2" />
        Volver al Inicio
      </Button>
      
      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 bg-transparent backdrop-blur-sm border-white/10 shadow-2xl">
        <CardHeader className="text-center bg-black/10 backdrop-blur-sm rounded-t-lg">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-white drop-shadow-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-white drop-shadow-2xl">Sistema de Despacho</CardTitle>
          <CardDescription className="text-white/90 drop-shadow-2xl">
            Ingrese sus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        
        <CardContent className="bg-black/10 backdrop-blur-sm rounded-b-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white drop-shadow-2xl font-semibold">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Ingrese su correo electrónico"
                required
                disabled={isLoading}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white drop-shadow-2xl font-semibold">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Ingrese su contraseña"
                  required
                  disabled={isLoading}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-white"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold" 
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-white/90 drop-shadow-lg">
            <p className="text-center mb-2 font-semibold">Credenciales de prueba:</p>
            <div className="space-y-1 text-xs bg-black/10 rounded-lg p-3 backdrop-blur-sm">
              <p>• admin@empresa.com / admin123 (Administrador)</p>
              <p>• director@empresa.com / director123 (Director)</p>
              <p>• operador@empresa.com / operador123 (Operador)</p>
              <p>• despachador@empresa.com / despachador123 (Despachador)</p>
              <p>• supervisor@empresa.com / supervisor123 (Supervisor)</p>
              <p>• tecnico@empresa.com / tecnico123 (Técnico)</p>
              <p>• jefe.tecnico@empresa.com / jefe123 (Jefe Técnicos)</p>
              <p>• ventas@empresa.com / ventas123 (Asesor Ventas)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
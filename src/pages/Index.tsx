import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();
  const [backgroundImage, setBackgroundImage] = useState('/lovable-uploads/b189fbe2-9643-4103-bb16-bf1857b39c78.png');

  useEffect(() => {
    // Cargar imagen de fondo desde localStorage
    const savedBackground = localStorage.getItem('backgroundImage');
    if (savedBackground) {
      setBackgroundImage(savedBackground);
    }
  }, []);

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-background" data-page="index">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content */}
      <div className="relative z-10 text-center text-white">
        <h1 className="text-5xl font-bold mb-2">
          <span className="teleguardia-ecosystem text-white">ECOSISTEMA </span>
          <span 
            className="teleguardia-text" 
            style={{color: 'hsl(var(--teleguardia-green))'}}
          >HAL</span><span 
            className="teleguardia-text" 
            style={{color: 'hsl(var(--teleguardia-blue))'}}
          >CON</span>
        </h1>
        <p className="text-lg text-gray-300 mb-6">
          
        </p>
        <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8">
          Sistema integral de despacho y monitoreo de patrullas de seguridad
        </p>
        
        <Button 
          onClick={() => navigate('/auth')}
          size="lg"
          className="bg-primary/90 hover:bg-primary text-white font-semibold px-8 py-3"
        >
          <LogIn className="h-5 w-5 mr-2" />
          Acceder al Sistema
        </Button>
      </div>
    </div>
  );
};

export default Index;

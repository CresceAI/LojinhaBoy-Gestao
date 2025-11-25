import { useRef, useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Trash2, Check } from 'lucide-react';

interface AssinaturaDigitalProps {
  onSave: (assinatura: string) => void;
  onCancel: () => void;
  assinaturaExistente?: string;
}

export const AssinaturaDigital = ({ onSave, onCancel, assinaturaExistente }: AssinaturaDigitalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar canvas
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Carregar assinatura existente se houver
    if (assinaturaExistente) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasDrawn(true);
      };
      img.src = assinaturaExistente;
    }
  }, [assinaturaExistente]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const assinatura = canvas.toDataURL('image/png');
    onSave(assinatura);
  };

  return (
    <Card className="apple-card">
      <CardHeader>
        <CardTitle>Assinatura Digital</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-background">
          <canvas
            ref={canvasRef}
            className="w-full h-48 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Desenhe sua assinatura acima usando o mouse ou toque
        </p>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={clearCanvas}
            className="flex-1 apple-button"
            disabled={!hasDrawn}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpar
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1 apple-button"
          >
            Cancelar
          </Button>
          <Button
            onClick={saveSignature}
            className="flex-1 apple-button"
            disabled={!hasDrawn}
          >
            <Check className="w-4 h-4 mr-2" />
            Salvar Assinatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

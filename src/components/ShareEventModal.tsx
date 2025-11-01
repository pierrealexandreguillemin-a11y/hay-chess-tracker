import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Share2, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { generateShareURL } from '@/lib/storage';

interface ShareEventModalProps {
  eventId: string;
  eventName: string;
  trigger?: React.ReactNode;
}

export default function ShareEventModal({ eventId, eventName, trigger }: ShareEventModalProps) {
  const [open, setOpen] = useState(false);
  const [shareData, setShareData] = useState<{ url: string; size: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      console.log('ShareEventModal: Generating URL for eventId:', eventId);
      const data = generateShareURL(eventId);
      console.log('ShareEventModal: Generated data:', data);
      setShareData(data);

      if (!data) {
        toast.error('Impossible de générer le lien de partage');
      }
    }
  }, [open, eventId]);

  const handleCopyURL = async () => {
    if (!shareData) return;

    try {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      toast.success('Lien copié dans le presse-papier !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      toast.error('Erreur lors de la copie');
    }
  };

  const urlSizeWarning = shareData && shareData.size > 2000;
  const qrCodeTooBig = shareData && shareData.size > 2900; // QR code limit

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="icon" className="miami-glass-foreground border-miami-aqua/30">
            <Share2 className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] miami-card border-miami-aqua/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-miami-aqua to-miami-navy bg-clip-text text-transparent">
            Partager l'événement
          </DialogTitle>
          <DialogDescription className="text-miami-navy/70">
            {eventName}
          </DialogDescription>
        </DialogHeader>

        {!shareData ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-miami-navy/60">Génération du lien...</div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* QR Code or Error */}
            {qrCodeTooBig ? (
              <Alert className="border-red-500/50 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  <strong>Événement trop volumineux pour un QR code</strong>
                  <br />
                  Utilisez le bouton "Export" (téléchargement) pour partager cet événement via fichier JSON.
                  Le lien ci-dessous reste utilisable pour copier/coller.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 rounded-lg" style={{
                background: 'white',
              }}>
                <QRCodeSVG
                  value={shareData.url}
                  size={200}
                  level="M"
                  includeMargin={true}
                />
                <p className="text-xs text-center text-miami-navy/60">
                  Scannez ce QR code pour importer l'événement
                </p>
              </div>
            )}

            {/* URL Warning */}
            {urlSizeWarning && (
              <Alert className="border-amber-500/50 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-sm">
                  URL longue ({shareData.size} caractères). Certains navigateurs peuvent avoir des limites.
                  Privilégiez l'export JSON pour les grands événements.
                </AlertDescription>
              </Alert>
            )}

            {/* URL Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-miami-navy">Lien de partage</label>
              <div className="flex gap-2">
                <div className="flex-1 p-3 rounded-md miami-glass-foreground border border-miami-aqua/20 overflow-x-auto">
                  <code className="text-xs break-all text-miami-navy/80">
                    {shareData.url}
                  </code>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyURL}
                  className={`flex-shrink-0 transition-colors ${
                    copied
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'miami-glass-foreground border-miami-aqua/30 hover:bg-miami-aqua/10'
                  }`}
                  title="Copier le lien"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="text-sm text-miami-navy/70 space-y-2 p-4 rounded-lg miami-glass-foreground border border-miami-aqua/10">
              <p className="font-semibold text-miami-navy">Comment utiliser :</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Scannez le QR code avec votre téléphone</li>
                <li>Ou copiez et partagez le lien</li>
                <li>L'événement sera automatiquement importé à l'ouverture</li>
              </ul>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const appUrl = 'https://hay-chess-tracker.vercel.app';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hay Chess Tracker',
          text: 'Suivez les tournois d\'échecs en temps réel',
          url: appUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-miami-navy hover:bg-miami-aqua/10"
          title="Partager l'application"
        >
          <Share2 className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] miami-card border-miami-aqua/30">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-miami-aqua to-miami-navy bg-clip-text text-transparent">
            Partager l'application
          </DialogTitle>
          <DialogDescription className="text-miami-navy/70">
            Partagez Hay Chess Tracker avec d'autres clubs ou joueurs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code */}
          <Card className="p-6 miami-glass-foreground flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={appUrl}
                size={200}
                level="H"
                includeMargin={true}
                fgColor="#013369"
              />
            </div>
            <p className="text-sm text-miami-navy/70 text-center">
              Scannez ce QR code pour accéder à l'application
            </p>
          </Card>

          {/* URL with Copy Button */}
          <Card className="p-4 miami-glass-foreground">
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-miami-navy bg-white/50 px-3 py-2 rounded">
                {appUrl}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="border-miami-aqua/30"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </Card>

          {/* Share Button (Web Share API) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="miami"
              className="w-full"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Partager
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

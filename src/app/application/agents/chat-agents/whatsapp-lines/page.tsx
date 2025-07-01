import WhatsAppConnectButton from '@/components/application/whatsapp-connect-button';

export default function WhatsAppLinesPage() {
  return (
    <main className="p-10 space-y-6">
      <h1 className="text-2xl font-bold">Conectar una línea de WhatsApp</h1>
      <p>Haz clic y sigue el flujo de Meta para autorizar la línea.</p>
      <WhatsAppConnectButton />
    </main>
  );
}
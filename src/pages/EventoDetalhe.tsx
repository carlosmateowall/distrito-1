import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Calendar, MapPin, Users, Check, ExternalLink, MessageCircle } from "lucide-react";

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  treino_grupo: { label: "Treino em Grupo", color: "text-green-400", bg: "bg-green-400/10 border-green-400/30" },
  masterclass: { label: "Masterclass", color: "text-primary", bg: "bg-primary/10 border-primary/30" },
  retiro: { label: "Retiro", color: "text-purple-400", bg: "bg-purple-400/10 border-purple-400/30" },
  devocional: { label: "Devocional", color: "text-primary-light", bg: "bg-primary-light/10 border-primary-light/30" },
  online: { label: "Online", color: "text-blue-400", bg: "bg-blue-400/10 border-blue-400/30" },
};

interface EventDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  datetime: string;
  location_name: string;
  location_address: string;
  location_lat: number | null;
  location_lng: number | null;
  max_capacity: number | null;
  cover_image_url: string | null;
  whatsapp_link: string | null;
}

interface Confirmation {
  user_id: string;
  profiles: { nome: string } | null;
}

function generateGoogleCalendarUrl(event: EventDetail): string {
  const start = new Date(event.datetime);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // 2h duration
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description,
    location: event.location_address || event.location_name,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function generateMapsUrl(event: EventDetail): string {
  if (event.location_lat && event.location_lng) {
    return `https://www.google.com/maps?q=${event.location_lat},${event.location_lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location_address || event.location_name)}`;
}

const EventoDetalhe = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmation[]>([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;

    const { data: evData } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    setEvent(evData as unknown as EventDetail | null);

    const { data: confs } = await supabase
      .from("event_confirmations")
      .select("user_id, profiles:user_id(nome)")
      .eq("event_id", id);

    setConfirmations((confs as unknown as Confirmation[]) ?? []);

    if (user && confs) {
      setIsConfirmed(confs.some((c: any) => c.user_id === user.id));
    }

    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleConfirm = async () => {
    if (!user || !id) return;

    const { error } = await supabase
      .from("event_confirmations")
      .insert({ event_id: id, user_id: user.id });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setIsConfirmed(true);
    setConfirmations((prev) => [...prev, { user_id: user.id, profiles: { nome: "Você" } }]);
    toast({ title: "Presença confirmada!" });
  };

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="font-display text-2xl text-primary animate-pulse tracking-wider">CARREGANDO...</span>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[event.type] || TYPE_CONFIG.online;
  const dt = new Date(event.datetime);
  const count = confirmations.length;
  const spotsLeft = event.max_capacity !== null ? event.max_capacity - count : null;
  const isFull = event.max_capacity !== null && count >= event.max_capacity;
  const hasCoords = event.location_lat && event.location_lng;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link
        to="/agenda"
        className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono text-xs uppercase tracking-wider"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar
      </Link>

      {/* Cover */}
      {event.cover_image_url ? (
        <div className="aspect-video rounded-lg overflow-hidden border border-primary/15">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video rounded-lg border border-primary/15 bg-background-tertiary flex items-center justify-center">
          <span className="font-display text-3xl text-primary/20 tracking-widest">DISTRITO 1%</span>
        </div>
      )}

      {/* Badge */}
      <span className={cn("inline-block px-2.5 py-1 rounded text-xs font-mono uppercase tracking-wider border", cfg.bg, cfg.color)}>
        {cfg.label}
      </span>

      {/* Title */}
      <h1 className="font-display text-4xl text-primary tracking-wider leading-tight">
        {event.title.toUpperCase()}
      </h1>

      {/* Info */}
      <div className="space-y-2 font-mono text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          {dt.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} às {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </p>
        {event.location_name && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            {event.location_name}{event.location_address ? ` — ${event.location_address}` : ""}
          </p>
        )}
        <p className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary shrink-0" />
          {count} confirmado{count !== 1 ? "s" : ""}
          {spotsLeft !== null && (
            <span className={cn(spotsLeft <= 3 ? "text-destructive" : "text-muted-foreground")}>
              · {spotsLeft} vaga{spotsLeft !== 1 ? "s" : ""} restante{spotsLeft !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {/* Description */}
      {event.description && (
        <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{event.description}</p>
      )}

      {/* Map */}
      {hasCoords && (
        <div className="rounded-lg overflow-hidden border border-primary/15 aspect-video">
          <iframe
            title="Localização"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${event.location_lat},${event.location_lng}&zoom=15`}
          />
        </div>
      )}

      {/* Confirmed avatars */}
      {confirmations.length > 0 && (
        <div>
          <p className="font-mono text-xs text-primary uppercase tracking-wider mb-3">Confirmados</p>
          <div className="flex items-center gap-2 flex-wrap">
            {confirmations.slice(0, 8).map((c, i) => (
              <div
                key={i}
                className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
                title={c.profiles?.nome || "Membro"}
              >
                <span className="font-display text-xs text-primary">
                  {(c.profiles?.nome || "?")[0].toUpperCase()}
                </span>
              </div>
            ))}
            {confirmations.length > 8 && (
              <span className="font-mono text-xs text-muted-foreground">
                e mais {confirmations.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {isConfirmed ? (
          <div className="flex items-center gap-2 text-[#4CAF72] font-mono text-sm uppercase tracking-wider py-3">
            <Check className="h-4 w-4" /> Presença confirmada
          </div>
        ) : isFull ? (
          <p className="font-mono text-sm text-destructive uppercase tracking-wider py-3">Evento lotado</p>
        ) : (
          <Button
            onClick={handleConfirm}
            className="bg-primary text-primary-foreground hover:bg-primary-light font-display text-lg tracking-wider h-12"
          >
            CONFIRMAR PRESENÇA
          </Button>
        )}

        <div className="flex gap-3 flex-wrap">
          <a
            href={generateGoogleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-mono text-xs uppercase tracking-wider"
          >
            <Calendar className="h-3.5 w-3.5" /> Google Calendar
          </a>

          {(event.location_name || hasCoords) && (
            <a
              href={generateMapsUrl(event)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/15 text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors font-mono text-xs uppercase tracking-wider"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver no Maps
            </a>
          )}

          {event.whatsapp_link && (
            <a
              href={event.whatsapp_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-green-400/30 text-green-400 hover:bg-green-400/10 transition-colors font-mono text-xs uppercase tracking-wider"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventoDetalhe;

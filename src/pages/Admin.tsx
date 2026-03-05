import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, CalendarPlus, Shield, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface EventRow {
  id: string;
  title: string;
  type: string;
  datetime: string;
  location_name: string;
  is_public: boolean;
}

const EVENT_TYPES = [
  { value: "treino_grupo", label: "Treino em Grupo" },
  { value: "masterclass", label: "Masterclass" },
  { value: "retiro", label: "Retiro" },
  { value: "devocional", label: "Devocional" },
  { value: "online", label: "Online" },
];

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [datetime, setDatetime] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [whatsappLink, setWhatsappLink] = useState("");

  // Redirect non-admins
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [adminLoading, isAdmin, navigate]);

  const loadEvents = useCallback(async () => {
    const { data } = await supabase
      .from("events")
      .select("id, title, type, datetime, location_name, is_public")
      .order("datetime", { ascending: false });
    setEvents(data ?? []);
    setLoadingEvents(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadEvents();
  }, [isAdmin, loadEvents]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("");
    setDatetime("");
    setLocationName("");
    setLocationAddress("");
    setMaxCapacity("");
    setIsPublic(true);
    setWhatsappLink("");
  };

  const handleCreate = async () => {
    if (!title || !type || !datetime) {
      toast({ title: "Preencha título, tipo e data/hora", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("events").insert({
      title,
      description,
      type,
      datetime: new Date(datetime).toISOString(),
      location_name: locationName,
      location_address: locationAddress,
      max_capacity: maxCapacity ? parseInt(maxCapacity) : null,
      is_public: isPublic,
      whatsapp_link: whatsappLink || null,
    });

    setSubmitting(false);

    if (error) {
      toast({ title: "Erro ao criar evento", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Evento criado com sucesso ✓" });
    resetForm();
    loadEvents();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Evento removido ✓" });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="font-display text-4xl text-primary tracking-wider">ADMIN</h1>
          <p className="text-muted-foreground font-mono text-xs uppercase tracking-wider">
            Gerenciamento de eventos
          </p>
        </div>
      </div>

      {/* Create Event Form */}
      <div className="bg-background-tertiary border border-primary/15 rounded-lg p-6 space-y-4">
        <p className="font-mono text-xs text-primary uppercase tracking-wider flex items-center gap-2">
          <CalendarPlus className="h-3.5 w-3.5" /> Criar evento
        </p>

        <div className="space-y-3">
          <div>
            <Label className="font-mono text-xs text-muted-foreground uppercase">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento"
              className="bg-background-secondary border-primary/15 mt-1"
            />
          </div>

          <div>
            <Label className="font-mono text-xs text-muted-foreground uppercase">Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes do evento..."
              className="bg-background-secondary border-primary/15 mt-1 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase">Tipo *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-background-secondary border-primary/15 mt-1">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase">Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                className="bg-background-secondary border-primary/15 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase">Nome do local</Label>
              <Input
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="Ex: Academia XYZ"
                className="bg-background-secondary border-primary/15 mt-1"
              />
            </div>
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase">Endereço</Label>
              <Input
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Rua, número, cidade"
                className="bg-background-secondary border-primary/15 mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase">Vagas máximas</Label>
              <Input
                type="number"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                placeholder="Sem limite"
                className="bg-background-secondary border-primary/15 mt-1"
              />
            </div>
            <div>
              <Label className="font-mono text-xs text-muted-foreground uppercase">Link WhatsApp</Label>
              <Input
                value={whatsappLink}
                onChange={(e) => setWhatsappLink(e.target.value)}
                placeholder="https://chat.whatsapp.com/..."
                className="bg-background-secondary border-primary/15 mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
            <Label className="font-mono text-xs text-muted-foreground uppercase">
              {isPublic ? "Evento público" : "Evento privado"}
            </Label>
          </div>

          <Button
            onClick={handleCreate}
            disabled={submitting}
            className="w-full mt-2 font-mono text-xs uppercase tracking-wider"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Criar Evento
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="bg-background-tertiary border border-primary/15 rounded-lg p-6">
        <p className="font-mono text-xs text-primary uppercase tracking-wider mb-4">
          Eventos existentes ({events.length})
        </p>

        {loadingEvents ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 skeleton-gold rounded-lg" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhum evento criado.</p>
        ) : (
          <div className="space-y-2">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 bg-background-secondary rounded-lg px-4 py-3 border border-primary/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{ev.title}</p>
                  <p className="font-mono text-[10px] text-muted-foreground uppercase">
                    {EVENT_TYPES.find((t) => t.value === ev.type)?.label ?? ev.type}
                    {" · "}
                    {format(new Date(ev.datetime), "dd/MM/yyyy HH:mm")}
                    {ev.location_name ? ` · ${ev.location_name}` : ""}
                    {!ev.is_public && " · 🔒 Privado"}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(ev.id)}
                  className="text-destructive hover:text-destructive/80 transition-colors shrink-0 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;

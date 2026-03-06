import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  challengeId: string;
  userId: string;
  onSuccess: () => void;
}

const ChallengePostForm = ({ open, onOpenChange, challengeId, userId, onSuccess }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setLoading(true);

    try {
      let photo_url: string | null = null;

      if (photo) {
        const ext = photo.name.split(".").pop();
        const path = `${challengeId}/${userId}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("challenge-photos")
          .upload(path, photo);

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage
          .from("challenge-photos")
          .getPublicUrl(path);

        photo_url = urlData.publicUrl;
      }

      const { error } = await supabase.from("challenge_posts").insert({
        challenge_id: challengeId,
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        photo_url,
      });

      if (error) throw error;

      toast({ title: "Treino registrado! 🔥" });
      setTitle("");
      setDescription("");
      setPhoto(null);
      onOpenChange(false);
      onSuccess();
    } catch {
      toast({ title: "Erro ao postar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar treino</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Treino de peito e costas" />
          </div>
          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhes do treino..." />
          </div>
          <div className="space-y-2">
            <Label>Foto (opcional)</Label>
            <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-md p-4 hover:border-primary/50 transition-colors">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {photo ? photo.name : "Toque para adicionar foto"}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setPhoto(e.target.files?.[0] || null)}
              />
            </label>
          </div>
          <Button className="w-full" onClick={handleSubmit} disabled={!title.trim() || loading}>
            {loading ? "Postando..." : "Postar treino (+1 pt)"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePostForm;

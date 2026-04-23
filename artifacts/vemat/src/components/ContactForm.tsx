import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  nom: z.string().min(2, "Le nom est requis"),
  entreprise: z.string().min(2, "L'entreprise est requise"),
  email: z.string().email("Email invalide"),
  telephone: z.string().min(8, "Numéro de téléphone requis"),
  typeDemande: z.string().min(1, "Veuillez sélectionner un type de demande"),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères"),
});

export function ContactForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      entreprise: "",
      email: "",
      telephone: "",
      typeDemande: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    toast({
      title: "Demande envoyée",
      description: "Notre équipe vous contactera dans les plus brefs délais.",
    });
    form.reset();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom complet</FormLabel>
                <FormControl>
                  <Input placeholder="Jean Dupont" className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="entreprise"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entreprise</FormLabel>
                <FormControl>
                  <Input placeholder="Société SA" className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email professionnel</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jean@societe.com" className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telephone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+212 600 00 00 00" className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="typeDemande"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type de demande</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="rounded-none bg-zinc-50 border-zinc-200">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="devis">Demande de devis</SelectItem>
                  <SelectItem value="location">Location d'engins</SelectItem>
                  <SelectItem value="sav">SAV & Maintenance</SelectItem>
                  <SelectItem value="pieces">Pièces de rechange</SelectItem>
                  <SelectItem value="autre">Autre demande</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message détaillé</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Décrivez votre besoin, le type d'équipement recherché, la durée prévue..." 
                  className="min-h-[120px] rounded-none bg-zinc-50 border-zinc-200" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 rounded-none font-bold px-8 h-12">
          Envoyer la demande
        </Button>
      </form>
    </Form>
  );
}

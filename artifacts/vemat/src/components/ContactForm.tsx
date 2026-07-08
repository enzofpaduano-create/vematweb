import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import { useLang } from "@/i18n/I18nProvider";
import { supabasePublic } from "@/lib/supabase";
import { sendContactEmail, type ContactTypeDemande } from "@/lib/emailService";

const messages = {
  fr: {
    nameReq: "Le nom est requis",
    companyReq: "L'entreprise est requise",
    emailInvalid: "Email invalide",
    phoneReq: "Numéro de téléphone requis",
    typeReq: "Veuillez sélectionner un type de demande",
    messageMin: "Le message doit contenir au moins 10 caractères",
    name: "Nom complet",
    company: "Entreprise",
    email: "Email professionnel",
    phone: "Téléphone",
    type: "Type de demande",
    message: "Message détaillé",
    select: "Sélectionner...",
    types: {
      devis: "Demande de devis",
      sav: "SAV & Maintenance",
      pieces: "Pièces de rechange",
      autre: "Autre demande",
    },
    placeholders: {
      name: "Jean Dupont",
      company: "Société SA",
      email: "jean@societe.com",
      phone: "+212 600 00 00 00",
      message: "Décrivez votre besoin, le type d'équipement recherché...",
    },
    submit: "Envoyer la demande",
    sending: "Envoi en cours…",
    successTitle: "Demande envoyée",
    successDesc: "Notre équipe vous contactera dans les plus brefs délais.",
    errorTitle: "Erreur d'envoi",
    errorDesc: "Une erreur est survenue. Réessayez ou écrivez-nous directement à vemat@vematgroup.com.",
  },
  en: {
    nameReq: "Name is required",
    companyReq: "Company is required",
    emailInvalid: "Invalid email",
    phoneReq: "Phone number required",
    typeReq: "Please select a request type",
    messageMin: "Message must be at least 10 characters",
    name: "Full name",
    company: "Company",
    email: "Business email",
    phone: "Phone",
    type: "Request type",
    message: "Detailed message",
    select: "Select...",
    types: {
      devis: "Quote request",
      sav: "After-sales & Maintenance",
      pieces: "Spare parts",
      autre: "Other request",
    },
    placeholders: {
      name: "John Doe",
      company: "Company Ltd",
      email: "john@company.com",
      phone: "+212 600 00 00 00",
      message: "Describe your need, the type of equipment...",
    },
    submit: "Send request",
    sending: "Sending…",
    successTitle: "Request sent",
    successDesc: "Our team will contact you as soon as possible.",
    errorTitle: "Send error",
    errorDesc: "An error occurred. Please retry or write to vemat@vematgroup.com directly.",
  },
};

function buildReference(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CTC-${year}-${rand}`;
}

export function ContactForm() {
  const { toast } = useToast();
  const { lang } = useLang();
  const m = messages[lang];
  const [submitting, setSubmitting] = useState(false);

  const formSchema = z.object({
    nom: z.string().min(2, m.nameReq),
    entreprise: z.string().min(2, m.companyReq),
    email: z.string().email(m.emailInvalid),
    telephone: z.string().min(8, m.phoneReq),
    typeDemande: z.enum(["devis", "sav", "pieces", "autre"], {
      errorMap: () => ({ message: m.typeReq }),
    }),
    message: z.string().min(10, m.messageMin),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: "",
      entreprise: "",
      email: "",
      telephone: "",
      typeDemande: undefined as unknown as ContactTypeDemande,
      message: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitting(true);
    const reference = buildReference();

    const payload = {
      reference,
      contact_name: values.nom,
      contact_email: values.email,
      contact_phone: values.telephone,
      company_name: values.entreprise,
      type_demande: values.typeDemande,
      message: values.message,
    };

    // 1. Sauvegarde en base (source de vérité)
    const { error: dbError } = await supabasePublic.from("form_contact").insert(payload);

    if (dbError) {
      toast({ title: m.errorTitle, description: m.errorDesc, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // 2. Email de notification (non bloquant — silencieux en cas d'échec)
    await sendContactEmail({
      reference,
      nom: values.nom,
      entreprise: values.entreprise,
      email: values.email,
      telephone: values.telephone,
      typeDemande: values.typeDemande,
      message: values.message,
    });

    toast({ title: m.successTitle, description: m.successDesc });
    form.reset();
    setSubmitting(false);
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
                <FormLabel>{m.name}</FormLabel>
                <FormControl>
                  <Input placeholder={m.placeholders.name} className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
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
                <FormLabel>{m.company}</FormLabel>
                <FormControl>
                  <Input placeholder={m.placeholders.company} className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
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
                <FormLabel>{m.email}</FormLabel>
                <FormControl>
                  <Input type="email" placeholder={m.placeholders.email} className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
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
                <FormLabel>{m.phone}</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder={m.placeholders.phone} className="rounded-none bg-zinc-50 border-zinc-200" {...field} />
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
              <FormLabel>{m.type}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? ""}>
                <FormControl>
                  <SelectTrigger className="rounded-none bg-zinc-50 border-zinc-200">
                    <SelectValue placeholder={m.select} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="devis">{m.types.devis}</SelectItem>
                  <SelectItem value="sav">{m.types.sav}</SelectItem>
                  <SelectItem value="pieces">{m.types.pieces}</SelectItem>
                  <SelectItem value="autre">{m.types.autre}</SelectItem>
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
              <FormLabel>{m.message}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={m.placeholders.message}
                  className="min-h-[120px] rounded-none bg-zinc-50 border-zinc-200"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto bg-accent text-accent-foreground hover:bg-accent/90 rounded-none font-bold px-8 h-12 disabled:opacity-70"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {m.sending}
            </span>
          ) : (
            m.submit
          )}
        </Button>
      </form>
    </Form>
  );
}

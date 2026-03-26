import { Layout } from "@/components/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Mensagem enviada!", description: "Obrigado pelo contato. Responderemos em breve." });
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-10 max-w-xl">
        <h1 className="font-serif font-bold text-3xl text-foreground mb-2">Contato</h1>
        <p className="text-muted-foreground mb-8">Envie sua mensagem e entraremos em contato o mais breve possível.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-foreground mb-1 block">Nome</label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Seu nome" />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-foreground mb-1 block">E-mail</label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="seu@email.com" />
          </div>
          <div>
            <label htmlFor="message" className="text-sm font-medium text-foreground mb-1 block">Mensagem</label>
            <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={5} placeholder="Escreva sua mensagem..." />
          </div>
          <Button type="submit" className="w-full">Enviar Mensagem</Button>
        </form>
      </div>
    </Layout>
  );
};

export default Contact;

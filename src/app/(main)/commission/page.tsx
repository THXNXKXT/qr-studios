"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import {
  Palette,
  CheckCircle,
  Clock,
  MessageCircle,
  Send,
  Upload,
  X,
} from "lucide-react";
import { Button, Card, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function CommissionPage() {
  const { t } = useTranslation("common");
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    discord: "",
    email: "",
    budget: "",
    description: "",
    deadline: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderTranslation = (key: string, options?: any): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  };

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username || prev.name,
        email: user.email || prev.email,
        discord: user.discordId ? `discord:${user.discordId}` : prev.discord,
      }));
    }
  }, [user]);

  const pricingPlans = useMemo(() => [
    {
      name: t("commission_page.pricing.basic.name"),
      price: 500,
      description: t("commission_page.pricing.basic.desc"),
      features: [
        t("commission_page.pricing.basic.f1"),
        t("commission_page.pricing.basic.f2"),
        t("commission_page.pricing.basic.f3"),
        t("commission_page.pricing.basic.f4"),
      ],
    },
    {
      name: t("commission_page.pricing.standard.name"),
      price: 1500,
      description: t("commission_page.pricing.standard.desc"),
      features: [
        t("commission_page.pricing.standard.f1"),
        t("commission_page.pricing.standard.f2"),
        t("commission_page.pricing.standard.f3"),
        t("commission_page.pricing.standard.f4"),
        t("commission_page.pricing.standard.f5"),
      ],
      popular: true,
    },
    {
      name: t("commission_page.pricing.premium.name"),
      price: 3500,
      description: t("commission_page.pricing.premium.desc"),
      features: [
        t("commission_page.pricing.premium.f1"),
        t("commission_page.pricing.premium.f2"),
        t("commission_page.pricing.premium.f3"),
        t("commission_page.pricing.premium.f4"),
        t("commission_page.pricing.premium.f5"),
        t("commission_page.pricing.premium.f6"),
      ],
    },
  ], [t]);

  const processSteps = useMemo(() => [
    {
      step: 1,
      title: t("commission_page.process.step1.title"),
      description: t("commission_page.process.step1.desc"),
    },
    {
      step: 2,
      title: t("commission_page.process.step2.title"),
      description: t("commission_page.process.step2.desc"),
    },
    {
      step: 3,
      title: t("commission_page.process.step3.title"),
      description: t("commission_page.process.step3.desc"),
    },
    {
      step: 4,
      title: t("commission_page.process.step4.title"),
      description: t("commission_page.process.step4.desc"),
    },
    {
      step: 5,
      title: t("commission_page.process.step5.title"),
      description: t("commission_page.process.step5.desc"),
    },
  ], [t]);

  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData, attachments);
    // จะเชื่อมต่อกับ API ในภายหลัง
  }, [formData, attachments]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-red-900/30 via-black to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-600/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-6 bg-red-500/10 text-red-500 border-red-500/20 px-4 py-1.5 text-sm">
              <Palette className="w-4 h-4 mr-2" />
              {renderTranslation("commission_page.hero.badge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
              {renderTranslation("commission_page.hero.title1")}{" "}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 to-red-700">
                {renderTranslation("commission_page.hero.title2")}
              </span>
              <br />
              {renderTranslation("commission_page.hero.title3")}
            </h1>
            <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-2xl mx-auto">
              {renderTranslation("commission_page.hero.desc")}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 px-8 h-12 rounded-xl font-bold text-sm">
                {renderTranslation("commission_page.hero.cta_details")}
              </Button>
              <a href="https://discord.gg/rQxc8ZNYE6" target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="lg" className="bg-white/5 border-white/10 px-8 h-12 rounded-xl font-bold text-sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {renderTranslation("commission_page.hero.cta_discord")}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-white/2 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              {renderTranslation("commission_page.process.section_title")}
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {renderTranslation("commission_page.process.section_desc")}
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-0 max-w-6xl mx-auto">
            {processSteps.map((item: any, index: number) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 w-full"
              >
                <div className="relative flex flex-col items-center text-center group">
                  {/* Connector Line */}
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] right-[-40%] h-[2px] bg-linear-to-r from-red-500/50 to-transparent z-0" />
                  )}
                  
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-black border-2 border-red-500/30 group-hover:border-red-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] flex items-center justify-center mb-4 transition-all duration-500">
                    <span className="text-xl font-bold text-red-500 group-hover:text-red-400">{item.step}</span>
                  </div>
                  
                  <h3 className="font-bold text-white text-base mb-2 group-hover:text-red-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-[180px] leading-relaxed group-hover:text-gray-400 transition-colors">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              {renderTranslation("commission_page.pricing.section_title")}
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              {renderTranslation("commission_page.pricing.section_desc")}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan: any, index: number) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <Card
                  className={cn(
                    "p-8 h-full relative border-white/5 bg-white/2 backdrop-blur-sm group hover:border-red-500/50 transition-all duration-500",
                    plan.popular ? "border-red-500/50 bg-red-500/5 ring-1 ring-red-500/20" : ""
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-lg shadow-red-600/30 uppercase tracking-widest">
                        {renderTranslation("commission_page.pricing.popular_badge")}
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-red-400 transition-colors">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-6">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-xs text-gray-400 font-medium">฿</span>
                      <span className="text-4xl font-black text-white group-hover:text-red-500 transition-colors tracking-tighter">
                        {plan.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500 font-normal">
                        {renderTranslation("commission_page.pricing.per_project")}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-10">
                    {plan.features.map((feature: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <span className="text-gray-300 group-hover:text-gray-200 transition-colors">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Button
                    variant={plan.popular ? "default" : "secondary"}
                    size="lg"
                    className={cn(
                      "w-full h-12 font-bold transition-all duration-300",
                      plan.popular ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20" : "bg-white/5 border-white/10 hover:bg-white/10"
                    )}
                  >
                    {renderTranslation("commission_page.pricing.cta_start")}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 md:p-12 border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
                
                <div className="text-center mb-10">
                  <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
                    {renderTranslation("commission_page.form.section_title")}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {renderTranslation("commission_page.form.section_desc")}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">
                        {renderTranslation("commission_page.form.name")}
                      </label>
                      <Input
                        placeholder={renderTranslation("commission_page.form.name_placeholder")}
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-red-500/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">
                        {renderTranslation("commission_page.form.discord")}
                      </label>
                      <Input
                        placeholder={renderTranslation("commission_page.form.discord_placeholder")}
                        value={formData.discord}
                        onChange={(e) =>
                          setFormData({ ...formData, discord: e.target.value })
                        }
                        className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-red-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">
                        {renderTranslation("commission_page.form.email")}
                      </label>
                      <Input
                        type="email"
                        placeholder={renderTranslation("commission_page.form.email_placeholder")}
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-red-500/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">
                        {renderTranslation("commission_page.form.budget")}
                      </label>
                      <Input
                        type="number"
                        placeholder={renderTranslation("commission_page.form.budget_placeholder")}
                        value={formData.budget}
                        onChange={(e) =>
                          setFormData({ ...formData, budget: e.target.value })
                        }
                        className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-red-500/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300 ml-1">
                      {renderTranslation("commission_page.form.details")}
                    </label>
                    <textarea
                      className="w-full h-40 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-4 text-sm text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 resize-none"
                      placeholder={renderTranslation("commission_page.form.details_placeholder")}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-300 ml-1 block">
                      {renderTranslation("commission_page.form.files")}
                    </label>
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-linear-to-r from-red-600/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-red-500/40 bg-white/2 transition-all duration-300 cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-6 h-6 text-red-500" />
                          </div>
                          <span className="text-gray-300 font-medium mb-1">
                            {renderTranslation("commission_page.form.upload_hint")}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {renderTranslation("commission_page.form.upload_limit")}
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Attachments Preview */}
                    <AnimatePresence>
                      {attachments.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex flex-wrap gap-3 mt-4"
                        >
                          {attachments.map((file, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl"
                            >
                              <span className="text-sm text-red-200 truncate max-w-[200px]">
                                {file.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-500/20 rounded-lg"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <Button 
                    type="submit" 
                    size="xl" 
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-12 shadow-xl shadow-red-600/20 rounded-xl group text-sm"
                  >
                    <span>{renderTranslation("commission_page.form.submit")}</span>
                    <Send className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Contact Info Footer */}
            <div className="mt-12 text-center">
              <p className="text-gray-500 mb-6 flex items-center justify-center gap-2">
                <span className="w-8 h-px bg-white/5" />
                {renderTranslation("commission_page.form.direct_chat")}
                <span className="w-8 h-px bg-white/5" />
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://discord.gg/rQxc8ZNYE6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <Button variant="secondary" className="bg-red-600 hover:bg-red-500 text-white border-none px-8 h-12 rounded-xl shadow-lg shadow-red-600/20">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Discord Server
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  Smartphone,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Star,
  Layers,
  ShoppingCart,
  Mail,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useIsMounted } from "@/hooks/useIsMounted";

export default function WebDesignPage() {
  const { t } = useTranslation("common");
  const mounted = useIsMounted();
  const [selectedService, setSelectedService] = useState<number | null>(null);

  const technologies = useMemo(() => [
    { name: "Next.js", color: "bg-black" },
    { name: "React", color: "bg-red-500" },
    { name: "TypeScript", color: "bg-red-600" },
    { name: "TailwindCSS", color: "bg-red-400" },
    { name: "Node.js", color: "bg-red-700" },
    { name: "PostgreSQL", color: "bg-red-800" },
    { name: "MongoDB", color: "bg-red-900" },
    { name: "Prisma", color: "bg-red-600" },
  ], []);

  const renderTranslation = useCallback((key: string, options?: Record<string, unknown>): string => {
    if (!mounted) return "";
    const result = t(key, options);
    return typeof result === "string" ? result : key;
  }, [t, mounted]);

  const handleServiceClick = useCallback((index: number) => {
    setSelectedService(prev => prev === index ? null : index);
  }, []);

  const services = useMemo(() => [
    {
      icon: Globe,
      title: t("web_design.services.business.title"),
      description: t("web_design.services.business.desc"),
      price: t("web_design.services.business.price"),
      features: [
        t("web_design.services.business.f1"),
        t("web_design.services.business.f2"),
        t("web_design.services.business.f3"),
        t("web_design.services.business.f4")
      ],
    },
    {
      icon: ShoppingCart,
      title: t("web_design.services.ecommerce.title"),
      description: t("web_design.services.ecommerce.desc"),
      price: t("web_design.services.ecommerce.price"),
      features: [
        t("web_design.services.ecommerce.f1"),
        t("web_design.services.ecommerce.f2"),
        t("web_design.services.ecommerce.f3"),
        t("web_design.services.ecommerce.f4")
      ],
    },
    {
      icon: Layers,
      title: t("web_design.services.app.title"),
      description: t("web_design.services.app.desc"),
      price: t("web_design.services.app.price"),
      features: [
        t("web_design.services.app.f1"),
        t("web_design.services.app.f2"),
        t("web_design.services.app.f3"),
        t("web_design.services.app.f4")
      ],
    },
    {
      icon: Smartphone,
      title: t("web_design.services.landing.title"),
      description: t("web_design.services.landing.desc"),
      price: t("web_design.services.landing.price"),
      features: [
        t("web_design.services.landing.f1"),
        t("web_design.services.landing.f2"),
        t("web_design.services.landing.f3"),
        t("web_design.services.landing.f4")
      ],
    },
  ], [t]);

  const processSteps = useMemo(() => [
    {
      step: 1,
      title: t("web_design.process.step1.title"),
      description: t("web_design.process.step1.desc"),
    },
    {
      step: 2,
      title: t("web_design.process.step2.title"),
      description: t("web_design.process.step2.desc"),
    },
    {
      step: 3,
      title: t("web_design.process.step3.title"),
      description: t("web_design.process.step3.desc"),
    },
    {
      step: 4,
      title: t("web_design.process.step4.title"),
      description: t("web_design.process.step4.desc"),
    },
  ], [t]);

  const portfolios = useMemo(() => [
    {
      title: t("web_design.portfolios.p1.title"),
      category: t("web_design.portfolios.p1.cat"),
      image: "/images/Query.Design.jpg",
    },
    {
      title: t("web_design.portfolios.p2.title"),
      category: t("web_design.portfolios.p2.cat"),
      image: "/images/Query.Design.jpg",
    },
    {
      title: t("web_design.portfolios.p3.title"),
      category: t("web_design.portfolios.p3.cat"),
      image: "/images/Query.Design.jpg",
    },
  ], [t]);

  const renderedServices = useMemo(() => services.map((service, index) => {
    const Icon = service.icon;
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
      >
        <Card
          className={cn(
            "p-6 h-full cursor-pointer transition-all duration-500 border-white/5 bg-white/2 backdrop-blur-sm group hover:border-red-500/50 hover:shadow-2xl hover:shadow-red-500/10",
            selectedService === index ? "border-red-500 bg-red-500/5 ring-1 ring-red-500/20" : ""
          )}
          onClick={() => handleServiceClick(index)}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500">
            <Icon className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
            {service.title}
          </h3>
          <p className="text-gray-400 text-xs mb-6 leading-relaxed">
            {service.description}
          </p>
          <div className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-normal uppercase tracking-wider">{renderTranslation("common.start_at")}</span>
            <span className="text-red-400 tracking-tighter">{service.price}</span>
          </div>
          <ul className="space-y-3">
            {service.features.map((feature, i) => (
              <li
                key={i}
                className="flex items-center gap-3 text-sm text-gray-400 group-hover:text-gray-300 transition-colors"
              >
                <div className="w-5 h-5 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 text-red-500" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>
    );
  }), [selectedService, handleServiceClick, services, renderTranslation]);

  const renderedTechnologies = useMemo(() => technologies.map((tech, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="px-8 py-4 rounded-2xl bg-white/5 border border-white/5 text-white font-bold hover:bg-red-600/10 hover:border-red-500/30 transition-all duration-300 hover:-translate-y-1 shadow-lg"
    >
      {tech.name}
    </motion.div>
  )), [technologies]);

  const renderedProcess = useMemo(() => processSteps.map((item, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      {/* Connector Line */}
      {index < processSteps.length - 1 && (
        <div className="hidden md:block absolute top-8 left-1/2 w-full h-[2px] bg-linear-to-r from-red-500/50 to-transparent z-0" />
      )}

      <div className="relative z-10 text-center group">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-black border-2 border-red-500/30 group-hover:border-red-500 group-hover:scale-110 group-hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] flex items-center justify-center mb-6 transition-all duration-500">
          <span className="text-xl font-bold text-red-500 group-hover:text-red-400">
            {item.step}
          </span>
        </div>
        <h3 className="text-base font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
          {item.title}
        </h3>
        <p className="text-gray-400 text-xs leading-relaxed">{item.description}</p>
      </div>
    </motion.div>
  )), [processSteps]);

  const renderedPortfolios = useMemo(() => portfolios.map((item, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group cursor-pointer"
    >
      <Card className="overflow-hidden border-white/5 bg-white/2 hover:border-red-500/50 transition-all duration-500 shadow-2xl">
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center backdrop-blur-[2px]">
            <Button variant="secondary" size="sm" className="bg-white text-black border-none font-bold">
              {renderTranslation("web_design.portfolios.view_details")}
            </Button>
          </div>
          <div className="absolute bottom-4 left-4 z-10">
            <Badge className="bg-red-600 text-white border-none px-3 shadow-lg shadow-red-600/20">
              {item.category}
            </Badge>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors">
            {item.title}
          </h3>
        </div>
      </Card>
    </motion.div>
  )), [portfolios, renderTranslation]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-red-900/30 via-black to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-400/5 rounded-full blur-[128px] animate-pulse delay-1000" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge className="mb-6 bg-red-500/10 text-red-500 border-red-500/20 px-4 py-1.5 text-sm">
              <Globe className="w-4 h-4 mr-2" />
              {renderTranslation("web_design.hero.badge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
              {renderTranslation("web_design.hero.title1")}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-400 to-red-700 animate-gradient">
                {renderTranslation("web_design.hero.title2")}
              </span>
            </h1>
            <p className="text-gray-400 text-base md:text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              {renderTranslation("web_design.hero.desc")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="https://discord.gg/rQxc8ZNYE6" target="_blank">
                <Button size="xl" className="group bg-red-600 hover:bg-red-500 shadow-xl shadow-red-600/20 px-8 h-12 rounded-xl font-black text-sm">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {renderTranslation("web_design.hero.cta_consult")}
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="secondary" size="xl" className="bg-white/5 border-white/10 hover:bg-white/10 px-8 h-12 rounded-xl font-bold text-sm">
                <Star className="w-4 h-4 mr-2" />
                {renderTranslation("web_design.hero.cta_portfolio")}
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              {renderTranslation("web_design.services.section_title")}
            </h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              {renderTranslation("web_design.services.section_desc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {renderedServices}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-24 bg-white/2 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-500/20 to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              {renderTranslation("web_design.process.section_title")}
            </h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              {renderTranslation("web_design.process.section_desc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {renderedProcess}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-linear-to-r from-transparent via-red-500/20 to-transparent" />
      </section>

      {/* Technologies */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-red-900/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              {renderTranslation("web_design.tech.section_title")}
            </h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              {renderTranslation("web_design.tech.section_desc")}
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {renderedTechnologies}
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              {renderTranslation("web_design.portfolios.section_title")}
            </h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              {renderTranslation("web_design.portfolios.section_desc")}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {renderedPortfolios}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-12 md:p-20 text-center relative overflow-hidden border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-red-400/10 rounded-full blur-[100px]" />
              <div className="relative z-10">
                <div className="w-20 h-20 mx-auto mb-8 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <Globe className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight">
                  {renderTranslation("web_design.cta.title")}
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-10 text-base leading-relaxed">
                  {renderTranslation("web_design.cta.desc")}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="https://discord.gg/rQxc8ZNYE6" target="_blank">
                    <Button size="xl" className="group bg-red-600 hover:bg-red-500 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-red-600/20 text-sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {renderTranslation("web_design.cta.btn_project")}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <a href="mailto:contact@qrstudio.com">
                    <Button variant="secondary" size="xl" className="bg-white/5 border-white/10 hover:bg-white/10 h-12 px-8 rounded-xl font-bold text-sm">
                      <Mail className="w-4 h-4 mr-2" />
                      {renderTranslation("web_design.cta.btn_email")}
                    </Button>
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

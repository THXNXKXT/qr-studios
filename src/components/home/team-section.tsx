"use client";

import { memo, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Code, Palette, Database, Globe, Box, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const teamMembers = [
  {
    name: "Endless",
    role: "Full-Stack Developer",
    avatar: "/images/team/member1.jpg",
    color: "red",
    icon: Code,
  },
  {
    name: "DEV 1",
    role: "UI/UX Designer",
    avatar: null,
    color: "red",
    icon: Palette,
  },
  {
    name: "DEV 2",
    role: "Backend Developer",
    avatar: null,
    color: "red",
    icon: Database,
  },
  {
    name: "DEV 3",
    role: "Frontend Developer",
    avatar: null,
    color: "red",
    icon: Globe,
  },
  {
    name: "DEV 4",
    role: "3D Artist",
    avatar: null,
    color: "red",
    icon: Box,
  },
];

const colorVariants: Record<string, { dot: string; border: string; bg: string; text: string }> = {
  red: {
    dot: "bg-red-500",
    border: "border-red-500/50 hover:border-red-500",
    bg: "bg-red-500/20",
    text: "text-red-400",
  },
};

export const TeamSection = memo(function TeamSection() {
  const { t } = useTranslation("common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderedTeam = useMemo(() => teamMembers.map((member, index) => {
    const colors = colorVariants[member.color];
    const Icon = member.icon;
    
    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group"
      >
        <div
          className={cn(
            "relative p-5 rounded-4xl bg-white/2 backdrop-blur-xl border-2 transition-all duration-500 hover:bg-white/5 shadow-2xl",
            colors.border
          )}
        >
          {/* Status Dot */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 z-20">
            <div className="relative">
              <span className={cn("block w-3.5 h-3.5 rounded-full border-2 border-black shadow-2xl", colors.dot)} />
              <span className={cn("absolute inset-0 rounded-full animate-ping opacity-40", colors.dot)} />
            </div>
          </div>

          <div className="relative aspect-square rounded-3xl overflow-hidden mb-5 bg-black/40 border border-white/5 group-hover:border-red-500/30 transition-all duration-500">
            {member.avatar ? (
              <Image
                src={member.avatar}
                alt={member.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-2"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform duration-500 group-hover:scale-110", colors.bg)}>
                  <Icon className={cn("w-8 h-8", colors.text)} />
                </div>
              </div>
            )}
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-red-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Info */}
          <div className="text-center relative z-10">
            <h3 className="font-black text-white text-lg mb-1 group-hover:text-red-400 transition-colors">{member.name}</h3>
            <div
              className={cn(
                "inline-block px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-transparent transition-all duration-500 group-hover:border-current group-hover:bg-transparent",
                colors.bg,
                colors.text
              )}
            >
              {member.role}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }), []);

  const renderTranslation = (key: string) => {
    if (!mounted) return "";
    return t(key);
  };

  if (!mounted) return null;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-red-900/5 to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[160px] opacity-50" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            {renderTranslation("team.creative_force")}
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
            {renderTranslation("team.title_1")}
            <br />
            {renderTranslation("team.title_2")} <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-400 to-red-700 animate-gradient">QR STUDIO</span>
          </h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto leading-relaxed">
            {renderTranslation("team.desc")}
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {renderedTeam}
        </div>
      </div>
    </section>
  );
});

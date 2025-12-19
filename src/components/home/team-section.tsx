"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Code, Palette, Database, Globe, Box, Sparkles } from "lucide-react";

const teamMembers = [
  {
    name: "QUERY",
    role: "Founder & Lead Developer",
    avatar: "/images/Query.Design.png",
    color: "red",
    icon: Code,
  },
  {
    name: "DEV 1",
    role: "UI/UX Designer",
    avatar: null,
    color: "blue",
    icon: Palette,
  },
  {
    name: "DEV 2",
    role: "Backend Developer",
    avatar: null,
    color: "purple",
    icon: Database,
  },
  {
    name: "DEV 3",
    role: "Frontend Developer",
    avatar: null,
    color: "green",
    icon: Globe,
  },
  {
    name: "DEV 4",
    role: "3D Artist",
    avatar: null,
    color: "orange",
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
  blue: {
    dot: "bg-blue-500",
    border: "border-blue-500/50 hover:border-blue-500",
    bg: "bg-blue-500/20",
    text: "text-blue-400",
  },
  purple: {
    dot: "bg-purple-500",
    border: "border-purple-500/50 hover:border-purple-500",
    bg: "bg-purple-500/20",
    text: "text-purple-400",
  },
  green: {
    dot: "bg-green-500",
    border: "border-green-500/50 hover:border-green-500",
    bg: "bg-green-500/20",
    text: "text-green-400",
  },
  orange: {
    dot: "bg-orange-500",
    border: "border-orange-500/50 hover:border-orange-500",
    bg: "bg-orange-500/20",
    text: "text-orange-400",
  },
};

export function TeamSection() {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-linear-to-b from-transparent via-red-900/5 to-transparent" />

      <div className="container mx-auto relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            THE DEVELOPERS
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            POWERING{" "}
            <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-red-600">
              QR STUDIO
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            เราคือทีมที่รวมความคิดสร้างสรรค์กับการพัฒนาสินค้าให้กับเซิร์ฟเวอร์
            เพื่อสร้างสิ่งที่ดีกว่าให้กับผู้ใช้งานของเรา
          </p>
        </motion.div>

        {/* Team Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {teamMembers.map((member, index) => {
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
                  className={`relative p-4 rounded-2xl bg-white/5 backdrop-blur-sm border-2 ${colors.border} transition-all duration-300 hover:bg-white/10`}
                >
                  {/* Status Dot */}
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2">
                    <span className={`block w-3 h-3 rounded-full ${colors.dot} shadow-lg`} />
                  </div>

                  {/* Avatar */}
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-4 bg-black/50">
                    {member.avatar ? (
                      <Image
                        src={member.avatar}
                        alt={member.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center`}>
                          <Icon className={`w-8 h-8 ${colors.text}`} />
                        </div>
                      </div>
                    )}
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Info */}
                  <div className="text-center">
                    <h3 className="font-bold text-white text-lg mb-2">{member.name}</h3>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {member.role}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

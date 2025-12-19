"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Globe,
  Code,
  Palette,
  Smartphone,
  Zap,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  MessageCircle,
  Star,
  Users,
  Layers,
  Database,
  ShoppingCart,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";

const services = [
  {
    icon: Globe,
    title: "เว็บไซต์ธุรกิจ",
    description: "เว็บไซต์สำหรับธุรกิจ บริษัท ร้านค้า พร้อมระบบจัดการหลังบ้าน",
    price: "เริ่มต้น ฿15,000",
    features: ["ออกแบบ UI/UX", "Responsive Design", "SEO พื้นฐาน", "แก้ไขได้ 3 ครั้ง"],
  },
  {
    icon: ShoppingCart,
    title: "E-Commerce",
    description: "ร้านค้าออนไลน์ครบวงจร พร้อมระบบชำระเงินและจัดการสินค้า",
    price: "เริ่มต้น ฿35,000",
    features: ["ระบบตะกร้าสินค้า", "ชำระเงินออนไลน์", "จัดการสต็อก", "รายงานยอดขาย"],
  },
  {
    icon: Layers,
    title: "Web Application",
    description: "ระบบเว็บแอปพลิเคชันตามความต้องการ เช่น ระบบจอง, CRM, ERP",
    price: "เริ่มต้น ฿50,000",
    features: ["ออกแบบตามความต้องการ", "ระบบ Authentication", "API Integration", "Database Design"],
  },
  {
    icon: Smartphone,
    title: "Landing Page",
    description: "หน้าเว็บโปรโมทสินค้าหรือบริการ เน้น Conversion สูง",
    price: "เริ่มต้น ฿8,000",
    features: ["ดีไซน์สวยงาม", "โหลดเร็ว", "Mobile First", "Call-to-Action"],
  },
];

const technologies = [
  { name: "Next.js", color: "bg-black" },
  { name: "React", color: "bg-blue-500" },
  { name: "TypeScript", color: "bg-blue-600" },
  { name: "TailwindCSS", color: "bg-cyan-500" },
  { name: "Node.js", color: "bg-green-600" },
  { name: "PostgreSQL", color: "bg-blue-700" },
  { name: "MongoDB", color: "bg-green-500" },
  { name: "Prisma", color: "bg-indigo-600" },
];

const process = [
  {
    step: 1,
    title: "พูดคุยความต้องการ",
    description: "รับฟังความต้องการและวิเคราะห์โปรเจกต์",
  },
  {
    step: 2,
    title: "ออกแบบ UI/UX",
    description: "ออกแบบหน้าตาและประสบการณ์ผู้ใช้",
  },
  {
    step: 3,
    title: "พัฒนาระบบ",
    description: "เขียนโค้ดและพัฒนาฟีเจอร์ต่างๆ",
  },
  {
    step: 4,
    title: "ทดสอบและส่งมอบ",
    description: "ทดสอบระบบและส่งมอบงาน",
  },
];

const portfolios = [
  {
    title: "ร้านค้าออนไลน์ Fashion",
    category: "E-Commerce",
    image: "/images/Query.Design.jpg",
  },
  {
    title: "ระบบจองห้องประชุม",
    category: "Web Application",
    image: "/images/Query.Design.jpg",
  },
  {
    title: "เว็บไซต์บริษัทรับเหมา",
    category: "Corporate Website",
    image: "/images/Query.Design.jpg",
  },
];

const whyChooseUs = [
  {
    icon: Code,
    title: "โค้ดคุณภาพ",
    description: "เขียนโค้ดสะอาด มาตรฐาน ง่ายต่อการดูแลรักษา",
  },
  {
    icon: Zap,
    title: "โหลดเร็ว",
    description: "เว็บไซต์โหลดเร็ว ประสิทธิภาพสูง ผ่าน Core Web Vitals",
  },
  {
    icon: Shield,
    title: "ปลอดภัย",
    description: "ระบบรักษาความปลอดภัยมาตรฐาน ป้องกันการโจมตี",
  },
  {
    icon: Clock,
    title: "ส่งงานตรงเวลา",
    description: "ทำงานตามกำหนด ไม่ทิ้งงาน มีอัพเดทความคืบหน้า",
  },
];

export default function WebDesignPage() {
  const [selectedService, setSelectedService] = useState<number | null>(null);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-red-900/20 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px]" />

        <div className="container mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-4">🌐 Web Development</Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              รับออกแบบและพัฒนา
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-400 to-red-600">
                เว็บไซต์มืออาชีพ
              </span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              บริการออกแบบและพัฒนาเว็บไซต์ครบวงจร ตั้งแต่เว็บไซต์ธุรกิจ
              ร้านค้าออนไลน์ ไปจนถึงระบบเว็บแอปพลิเคชันตามความต้องการ
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="https://discord.gg/your-discord" target="_blank">
                <Button size="xl" className="group">
                  <MessageCircle className="w-5 h-5" />
                  ติดต่อสอบถาม
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button variant="secondary" size="xl">
                <Star className="w-5 h-5" />
                ดูผลงาน
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
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              บริการของเรา
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              เลือกบริการที่เหมาะกับความต้องการของคุณ
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
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
                    className={`p-6 h-full cursor-pointer transition-all hover:border-red-500/50 ${
                      selectedService === index ? "border-red-500" : ""
                    }`}
                    onClick={() => setSelectedService(index)}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {service.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">
                      {service.description}
                    </p>
                    <p className="text-red-400 font-semibold mb-4">
                      {service.price}
                    </p>
                    <ul className="space-y-2">
                      {service.features.map((feature, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-2 text-sm text-gray-400"
                        >
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-red-900/10 to-transparent" />
        <div className="container mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ทำไมต้องเลือกเรา
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              เราใส่ใจในทุกรายละเอียดเพื่อให้คุณได้เว็บไซต์ที่ดีที่สุด
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyChooseUs.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-16">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ขั้นตอนการทำงาน
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              กระบวนการทำงานที่ชัดเจน โปร่งใส ติดตามได้ทุกขั้นตอน
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {process.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connector Line */}
                {index < process.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-linear-to-r from-red-500/50 to-transparent" />
                )}

                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-red-400">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-blue-900/10 to-transparent" />
        <div className="container mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              เทคโนโลยีที่ใช้
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              เราใช้เทคโนโลยีที่ทันสมัยและเป็นที่นิยมในปัจจุบัน
            </p>
          </motion.div>

          <div className="flex flex-wrap justify-center gap-4">
            {technologies.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
              >
                {tech.name}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Preview */}
      <section className="py-16">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              ผลงานที่ผ่านมา
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              ตัวอย่างผลงานเว็บไซต์ที่เราได้พัฒนาให้ลูกค้า
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {portfolios.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm">
                      ดูรายละเอียด
                    </Button>
                  </div>
                </div>
                <Badge variant="secondary" className="mb-2">
                  {item.category}
                </Badge>
                <h3 className="text-lg font-semibold text-white">
                  {item.title}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-red-600/20 to-blue-600/20" />
              <div className="relative">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
                  <Globe className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  พร้อมเริ่มโปรเจกต์ของคุณ?
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto mb-8">
                  ติดต่อเราวันนี้เพื่อปรึกษาและรับใบเสนอราคาฟรี
                  ทีมงานพร้อมให้คำปรึกษาตลอด 24 ชั่วโมง
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="https://discord.gg/your-discord" target="_blank">
                    <Button size="xl" className="group">
                      <MessageCircle className="w-5 h-5" />
                      ติดต่อผ่าน Discord
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link href="https://line.me/your-line" target="_blank">
                    <Button variant="secondary" size="xl">
                      <Users className="w-5 h-5" />
                      ติดต่อผ่าน LINE
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

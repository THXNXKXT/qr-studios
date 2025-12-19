"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Mail,
  MessageCircle,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

const contactMethods = [
  {
    icon: MessageCircle,
    title: "Discord",
    description: "ติดต่อผ่าน Discord Server",
    value: "QR STUDIO",
    link: "https://discord.gg/your-discord",
    color: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
    buttonText: "เข้าร่วม Discord",
  },
  {
    icon: Mail,
    title: "Email",
    description: "ส่งอีเมลหาเรา",
    value: "contact@qrstudio.com",
    link: "mailto:contact@qrstudio.com",
    color: "bg-red-500/20",
    iconColor: "text-red-400",
    buttonText: "ส่งอีเมล",
  },
  {
    icon: Phone,
    title: "LINE",
    description: "แอดไลน์พูดคุย",
    value: "@qrstudio",
    link: "https://line.me/ti/p/@qrstudio",
    color: "bg-green-500/20",
    iconColor: "text-green-400",
    buttonText: "แอดไลน์",
  },
];

const faqs = [
  {
    question: "สามารถขอดูตัวอย่างก่อนซื้อได้ไหม?",
    answer: "ได้ครับ สามารถติดต่อเราผ่าน Discord เพื่อขอดูตัวอย่างหรือสอบถามรายละเอียดเพิ่มเติมได้เลย",
  },
  {
    question: "หลังซื้อแล้วมีการซัพพอร์ตไหม?",
    answer: "มีครับ เรามีทีมซัพพอร์ตพร้อมช่วยเหลือตลอด และมีอัพเดทฟรีตลอดชีพ",
  },
  {
    question: "รับชำระเงินผ่านช่องทางไหนบ้าง?",
    answer: "รับชำระผ่านโอนธนาคาร, TrueMoney Wallet, และ PromptPay",
  },
  {
    question: "ใช้เวลานานแค่ไหนในการทำ Commission?",
    answer: "ขึ้นอยู่กับความซับซ้อนของงาน โดยทั่วไป UI ง่ายๆ 3-5 วัน, งานซับซ้อน 1-2 สัปดาห์",
  },
  {
    question: "สามารถขอแก้ไขงานได้กี่ครั้ง?",
    answer: "สำหรับ Commission สามารถแก้ไขได้ 3 ครั้งฟรี หลังจากนั้นคิดค่าแก้ไขเพิ่มเติม",
  },
];

const businessHours = [
  { day: "จันทร์ - ศุกร์", hours: "10:00 - 22:00" },
  { day: "เสาร์ - อาทิตย์", hours: "12:00 - 20:00" },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });

    // Reset success message after 5 seconds
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-red-900/20 to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-[128px]" />

        <div className="container mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <Mail className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              ติดต่อเรา
            </h1>
            <p className="text-gray-400 text-lg">
              มีคำถามหรือต้องการสอบถามข้อมูลเพิ่มเติม? ติดต่อเราได้ตลอด 24 ชั่วโมง
              ทีมงานพร้อมให้บริการ
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-6 h-full text-center hover:border-red-500/50 transition-colors">
                    <div
                      className={`w-16 h-16 mx-auto rounded-2xl ${method.color} flex items-center justify-center mb-4`}
                    >
                      <Icon className={`w-8 h-8 ${method.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {method.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      {method.description}
                    </p>
                    <p className="text-white font-medium mb-4">{method.value}</p>
                    <Link href={method.link} target="_blank">
                      <Button variant="secondary" className="w-full group">
                        {method.buttonText}
                        <ExternalLink className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-6 md:p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  ส่งข้อความถึงเรา
                </h2>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      ส่งข้อความสำเร็จ!
                    </h3>
                    <p className="text-gray-400">
                      เราจะติดต่อกลับโดยเร็วที่สุด
                    </p>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          ชื่อ
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="ชื่อของคุณ"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                          อีเมล
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        หัวข้อ
                      </label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="หัวข้อที่ต้องการติดต่อ"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        ข้อความ
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="รายละเอียดที่ต้องการสอบถาม..."
                        rows={5}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          กำลังส่ง...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          ส่งข้อความ
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </Card>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Business Hours */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    เวลาทำการ
                  </h3>
                </div>
                <div className="space-y-3">
                  {businessHours.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <span className="text-gray-400">{item.day}</span>
                      <span className="text-white font-medium">{item.hours}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  * นอกเวลาทำการสามารถฝากข้อความไว้ได้ เราจะติดต่อกลับโดยเร็วที่สุด
                </p>
              </Card>

              {/* Location */}
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">ที่ตั้ง</h3>
                </div>
                <p className="text-gray-400">
                  ให้บริการออนไลน์ทั่วประเทศไทย
                  <br />
                  สามารถติดต่อผ่านช่องทางออนไลน์ได้ตลอด
                </p>
              </Card>

              {/* Quick Links */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  ลิงก์ด่วน
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/products">
                    <Button variant="secondary" className="w-full justify-start">
                      ดูสินค้าทั้งหมด
                    </Button>
                  </Link>
                  <Link href="/commission">
                    <Button variant="secondary" className="w-full justify-start">
                      รับทำ UI
                    </Button>
                  </Link>
                  <Link href="/web-design">
                    <Button variant="secondary" className="w-full justify-start">
                      รับทำเว็บ
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="secondary" className="w-full justify-start">
                      Dashboard
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              คำถามที่พบบ่อย
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              รวมคำถามที่ลูกค้าถามบ่อย หากไม่พบคำตอบสามารถติดต่อเราได้เลย
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`overflow-hidden cursor-pointer transition-all ${
                    openFaq === index ? "border-red-500/50" : ""
                  }`}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <div className="p-4 flex items-center justify-between">
                    <h3 className="font-medium text-white">{faq.question}</h3>
                    <div
                      className={`w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-transform ${
                        openFaq === index ? "rotate-45" : ""
                      }`}
                    >
                      <span className="text-white text-lg">+</span>
                    </div>
                  </div>
                  {openFaq === index && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-4 pb-4"
                    >
                      <p className="text-gray-400">{faq.answer}</p>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-8 md:p-12 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-r from-red-600/20 to-orange-600/20" />
              <div className="relative">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  ยังมีคำถามอยู่?
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-6">
                  ทีมงานของเราพร้อมให้บริการและตอบคำถามทุกข้อสงสัย
                </p>
                <Link href="https://discord.gg/your-discord" target="_blank">
                  <Button size="xl" className="group">
                    <MessageCircle className="w-5 h-5" />
                    เข้าร่วม Discord
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

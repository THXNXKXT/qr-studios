"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
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
import { useTranslation } from "react-i18next";
import { Button, Card, Input, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

export default function ContactPage() {
  const { t } = useTranslation(["home", "common"]);
  const { user } = useAuth();

  const faqs = [
    {
      question: t("misc.faq.items.preview.q", { defaultValue: "สามารถขอดูตัวอย่างก่อนซื้อได้ไหม?" }),
      answer: t("misc.faq.items.preview.a", { defaultValue: "ได้ครับ สามารถติดต่อเราผ่าน Discord เพื่อขอดูตัวอย่างหรือสอบถามรายละเอียดเพิ่มเติมได้เลย" }),
    },
    {
      question: t("misc.faq.items.support.q", { defaultValue: "หลังซื้อแล้วมีการซัพพอร์ตไหม?" }),
      answer: t("misc.faq.items.support.a", { defaultValue: "มีครับ เรามีทีมซัพพอร์ตพร้อมช่วยเหลือตลอด และมีอัพเดทฟรีตลอดชีพ" }),
    },
    {
      question: t("misc.faq.items.payment.q", { defaultValue: "รับชำระเงินผ่านช่องทางไหนบ้าง?" }),
      answer: t("misc.faq.items.payment.a", { defaultValue: "รับชำระผ่านโอนธนาคาร, TrueMoney Wallet, และ PromptPay" }),
    },
    {
      question: t("misc.faq.items.commission_time.q", { defaultValue: "ใช้เวลานานแค่ไหนในการทำ Commission?" }),
      answer: t("misc.faq.items.commission_time.a", { defaultValue: "ขึ้นอยู่กับความซับซ้อนของงาน โดยทั่วไป UI ง่ายๆ 3-5 วัน, งานซับซ้อน 1-2 สัปดาห์" }),
    },
    {
      question: t("misc.faq.items.revisions.q", { defaultValue: "สามารถขอแก้ไขงานได้กี่ครั้ง?" }),
      answer: t("misc.faq.items.revisions.a", { defaultValue: "สำหรับ Commission สามารถแก้ไขได้ 3 ครั้งฟรี หลังจากนั้นคิดค่าแก้ไขเพิ่มเติม" }),
    },
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: t("misc.contact.methods.discord.title"),
      description: t("misc.contact.methods.discord.desc"),
      value: "QR STUDIO",
      link: "https://discord.gg/rQxc8ZNYE6",
      color: "bg-red-500/20",
      iconColor: "text-red-400",
      buttonText: t("misc.contact.methods.discord.btn"),
    },
    {
      icon: Mail,
      title: t("misc.contact.methods.email.title"),
      description: t("misc.contact.methods.email.desc"),
      value: "contact@qrstudio.com",
      link: "mailto:contact@qrstudio.com",
      color: "bg-red-500/20",
      iconColor: "text-red-400",
      buttonText: t("misc.contact.methods.email.btn"),
    },
    {
      icon: Phone,
      title: t("misc.contact.methods.line.title"),
      description: t("misc.contact.methods.line.desc"),
      value: "@qrstudio",
      link: "https://line.me/ti/p/@qrstudio",
      color: "bg-red-500/20",
      iconColor: "text-red-400",
      buttonText: t("misc.contact.methods.line.btn"),
    },
  ];

  const businessHours = [
    { day: t("common:common.mon_fri", { defaultValue: "จันทร์ - ศุกร์" }), hours: "10:00 - 22:00" },
    { day: t("common:common.sat_sun", { defaultValue: "เสาร์ - อาทิตย์" }), hours: "12:00 - 20:00" },
  ];
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  useEffect(() => {
    if (user) {
      // Defer setState to avoid react-hooks/set-state-in-effect warning
      queueMicrotask(() => {
        setFormData((prev) => ({
          ...prev,
          name: user.username || prev.name,
          email: user.email || prev.email,
        }));
      });
    }
  }, [user]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", email: "", subject: "", message: "" });

    // Reset success message after 5 seconds
    setTimeout(() => setIsSubmitted(false), 5000);
  }, []);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const toggleFaq = useCallback((index: number) => {
    setOpenFaq(prev => prev === index ? null : index);
  }, []);

  return (
    <div className="min-h-screen pt-20">
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-red-900/30 via-black to-black" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[128px] animate-pulse" />

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <Badge className="mb-6 bg-red-500/10 text-red-500 border-red-500/20 px-4 py-1.5 text-sm">
              <Mail className="w-4 h-4 mr-2" />
              {t("misc.contact.hero_badge")}
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
              {t("misc.contact.title")}
              <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-red-500 via-red-400 to-red-700 animate-gradient">
                {t("misc.contact.title_highlight")}
              </span>
            </h1>
            <p className="text-gray-400 text-base leading-relaxed max-w-2xl mx-auto">
              {t("misc.contact.hero_desc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 relative z-10 -mt-12">
        <div className="container mx-auto px-4">
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
                  <Card className="p-6 h-full text-center border-white/5 bg-black/40 backdrop-blur-xl hover:border-red-500/50 transition-all duration-500 group shadow-2xl">
                    <div
                      className={`w-16 h-16 mx-auto rounded-3xl ${method.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-500/30 transition-all duration-500 border border-white/5`}
                    >
                      <Icon className={`w-8 h-8 ${method.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors">
                      {method.title}
                    </h3>
                    <p className="text-gray-400 text-xs mb-4 leading-relaxed px-4">
                      {method.description}
                    </p>
                    <p className="text-white font-bold text-base mb-8 tracking-wide group-hover:text-red-200 transition-colors">{method.value}</p>
                    <Link href={method.link} target="_blank" className="block mt-auto">
                      <Button variant="secondary" className="w-full h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white group/btn text-xs rounded-xl">
                        <span>{method.buttonText}</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-2 transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1" />
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
              <Card className="p-8 md:p-10 border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl relative overflow-hidden h-full">
                <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-red-600 to-transparent" />

                <h2 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                  {t("misc.contact.form.title")}
                </h2>
                <p className="text-gray-400 text-sm mb-8">
                  {t("misc.contact.form.desc")}
                </p>

                {isSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <CheckCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {t("misc.contact.form.success_title")}
                    </h3>
                    <p className="text-gray-400">
                      {t("misc.contact.form.success_desc")}
                    </p>
                    <Button
                      variant="secondary"
                      className="mt-8 bg-white/5 border-white/10"
                      onClick={() => setIsSubmitted(false)}
                    >
                      {t("misc.contact.form.send_new")}
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">
                          {t("misc.contact.form.name")}
                        </label>
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={t("misc.contact.form.name_placeholder")}
                          className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-red-500/50"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 ml-1">
                          {t("misc.contact.form.email")}
                        </label>
                        <Input
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder={t("misc.contact.form.email_placeholder")}
                          className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-red-500/50"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">
                        {t("misc.contact.form.subject")}
                      </label>
                      <Input
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder={t("misc.contact.form.subject_placeholder")}
                        className="bg-white/5 border-white/10 h-12 rounded-xl focus:border-red-500/50"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">
                        {t("misc.contact.form.message")}
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={t("misc.contact.form.message_placeholder")}
                        rows={6}
                        required
                        className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/50 transition-all resize-none"
                      />
                    </div>
                    <Button
                      type="submit"
                      size="xl"
                      className="w-full bg-red-600 hover:bg-red-500 text-white font-black h-12 shadow-xl shadow-red-600/20 rounded-xl group text-sm"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{t("misc.contact.form.submitting")}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>{t("misc.contact.form.submit")}</span>
                          <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </div>
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
              <Card className="p-6 border-white/5 bg-black/40 backdrop-blur-xl hover:border-red-500/30 transition-all duration-500 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {t("misc.contact.info.hours_title")}
                    </h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t("misc.contact.info.hours_badge")}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {businessHours.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-3 border-b border-white/5 last:border-0 group"
                    >
                      <span className="text-gray-400 group-hover:text-gray-300 transition-colors">{item.day}</span>
                      <span className="text-white font-bold bg-white/5 px-3 py-1 rounded-lg border border-white/5 group-hover:border-red-500/30 transition-all">{item.hours}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <p className="text-xs text-red-400/80 leading-relaxed">
                    {t("misc.contact.info.hours_hint")}
                  </p>
                </div>
              </Card>

              {/* Location */}
              <Card className="p-6 border-white/5 bg-black/40 backdrop-blur-xl hover:border-red-500/30 transition-all duration-500 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{t("misc.contact.info.location_title")}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t("misc.contact.info.location_badge")}</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {t("misc.contact.info.location_desc")}
                </p>
              </Card>

              {/* Quick Links */}
              <Card className="p-6 border-white/5 bg-black/40 backdrop-blur-xl hover:border-red-500/30 transition-all duration-500 shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-red-600 rounded-full" />
                  {t("misc.contact.info.links_title")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/products">
                    <Button variant="secondary" className="w-full justify-start h-11 bg-white/5 border-white/10 hover:bg-red-600/10 hover:border-red-500/30 group text-xs rounded-xl">
                      <ArrowRight className="w-3.5 h-3.5 mr-2 text-red-500 group-hover:translate-x-1 transition-transform" />
                      {t("common:dashboard.menu.orders")}
                    </Button>
                  </Link>
                  <Link href="/commission">
                    <Button variant="secondary" className="w-full justify-start h-11 bg-white/5 border-white/10 hover:bg-red-600/10 hover:border-red-500/30 group text-xs rounded-xl">
                      <ArrowRight className="w-3.5 h-3.5 mr-2 text-red-500 group-hover:translate-x-1 transition-transform" />
                      {t("common:nav.ui_service")}
                    </Button>
                  </Link>
                  <Link href="/web-design">
                    <Button variant="secondary" className="w-full justify-start h-11 bg-white/5 border-white/10 hover:bg-red-600/10 hover:border-red-500/30 group text-xs rounded-xl">
                      <ArrowRight className="w-3.5 h-3.5 mr-2 text-red-500 group-hover:translate-x-1 transition-transform" />
                      {t("common:nav.web_service")}
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="secondary" className="w-full justify-start h-11 bg-white/5 border-white/10 hover:bg-red-600/10 hover:border-red-500/30 group text-xs rounded-xl">
                      <ArrowRight className="w-3.5 h-3.5 mr-2 text-red-500 group-hover:translate-x-1 transition-transform" />
                      {t("common:nav.dashboard")}
                    </Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-72 h-72 bg-red-600/5 rounded-full blur-[100px]" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl md:text-3xl font-black text-white mb-3 tracking-tight">
              {t("misc.faq.subtitle")}
            </h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto">
              {t("misc.faq.desc")}
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto space-y-4 relative z-10">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "overflow-hidden cursor-pointer transition-all duration-300 border-white/5 bg-white/2 hover:border-red-500/30",
                    openFaq === index ? "border-red-500/50 bg-red-500/5 ring-1 ring-red-500/10" : ""
                  )}
                  onClick={() => toggleFaq(index)}
                >
                  <div className="p-6 flex items-center justify-between gap-4">
                    <h3 className={cn(
                      "font-bold transition-colors",
                      openFaq === index ? "text-red-400" : "text-white"
                    )}>
                      {faq.question}
                    </h3>
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center transition-all duration-300",
                        openFaq === index ? "rotate-45 bg-red-500 text-white" : "text-gray-400"
                      )}
                    >
                      <span className="text-xl leading-none">+</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {openFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <div className="px-6 pb-6 pt-2 border-t border-white/5 mt-2">
                          <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-10 md:p-16 text-center relative overflow-hidden border-white/5 bg-black/40 backdrop-blur-2xl shadow-2xl">
              <div className="absolute inset-0 bg-linear-to-r from-red-600/10 to-transparent" />
              <div className="relative z-10">
                <h2 className="text-2xl md:text-4xl font-black text-white mb-6 leading-tight tracking-tight">
                  {t("misc.faq.no_answer_title")}
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-10 text-base leading-relaxed">
                  {t("misc.faq.no_answer_desc")}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link href="https://discord.gg/rQxc8ZNYE6" target="_blank">
                    <Button size="xl" className="group bg-red-600 hover:bg-red-500 text-white font-black h-12 px-8 rounded-xl shadow-xl shadow-red-600/20 text-sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {t("misc.faq.join_discord")}
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
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

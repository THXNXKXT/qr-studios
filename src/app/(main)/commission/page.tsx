"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Palette,
  CheckCircle,
  Clock,
  MessageCircle,
  Send,
  Upload,
  X,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";

const pricingPlans = [
  {
    name: "Basic",
    price: 500,
    description: "สำหรับ UI ขนาดเล็ก",
    features: [
      "UI ขนาดเล็ก 1 หน้า",
      "แก้ไข 2 ครั้ง",
      "ส่งมอบภายใน 3 วัน",
      "ซัพพอร์ต 7 วัน",
    ],
  },
  {
    name: "Standard",
    price: 1500,
    description: "สำหรับ UI ขนาดกลาง",
    features: [
      "UI ขนาดกลาง 3 หน้า",
      "แก้ไขไม่จำกัด",
      "ส่งมอบภายใน 5 วัน",
      "ซัพพอร์ต 14 วัน",
      "Source Code",
    ],
    popular: true,
  },
  {
    name: "Premium",
    price: 3500,
    description: "สำหรับ UI ขนาดใหญ่",
    features: [
      "UI ขนาดใหญ่ไม่จำกัดหน้า",
      "แก้ไขไม่จำกัด",
      "ส่งมอบภายใน 7 วัน",
      "ซัพพอร์ตตลอดชีพ",
      "Source Code",
      "Priority Support",
    ],
  },
];

const process = [
  {
    step: 1,
    title: "ส่งรายละเอียด",
    description: "บอกความต้องการและแนบไฟล์อ้างอิง",
  },
  {
    step: 2,
    title: "ประเมินราคา",
    description: "เราจะประเมินราคาและระยะเวลา",
  },
  {
    step: 3,
    title: "ชำระเงิน",
    description: "ชำระเงินมัดจำ 50%",
  },
  {
    step: 4,
    title: "ดำเนินการ",
    description: "เริ่มออกแบบและพัฒนา",
  },
  {
    step: 5,
    title: "ส่งมอบงาน",
    description: "ส่งมอบงานและชำระส่วนที่เหลือ",
  },
];

export default function CommissionPage() {
  const [formData, setFormData] = useState({
    name: "",
    discord: "",
    email: "",
    budget: "",
    description: "",
    deadline: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData, attachments);
    // จะเชื่อมต่อกับ API ในภายหลัง
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-16 relative">
        <div className="absolute inset-0 bg-linear-to-b from-red-900/20 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
              <Palette className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              รับทำ UI ตามสั่ง
            </h1>
            <p className="text-gray-400 text-lg">
              ออกแบบและพัฒนา UI สำหรับ FiveM ตามความต้องการของคุณ
              โดยทีมงานมืออาชีพ
            </p>
          </motion.div>
        </div>
      </section>

      {/* Process */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            ขั้นตอนการทำงาน
          </h2>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-0">
            {process.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mb-2">
                    <span className="text-red-400 font-bold">{item.step}</span>
                  </div>
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 max-w-[120px]">
                    {item.description}
                  </p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden md:block w-16 h-0.5 bg-red-500/30 mx-2" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            แพ็คเกจราคา
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-6 h-full relative ${
                    plan.popular ? "border-red-500" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                        ยอดนิยม
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-4">{plan.description}</p>
                    <div className="text-3xl font-bold text-red-400">
                      ฿{plan.price.toLocaleString()}
                      <span className="text-sm text-gray-500 font-normal">
                        /งาน
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.popular ? "default" : "secondary"}
                    className="w-full"
                  >
                    เลือกแพ็คเกจ
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8">
                <h2 className="text-2xl font-bold text-white mb-2 text-center">
                  ส่งรายละเอียดงาน
                </h2>
                <p className="text-gray-400 text-center mb-8">
                  กรอกข้อมูลด้านล่างเพื่อขอใบเสนอราคา
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        ชื่อ *
                      </label>
                      <Input
                        placeholder="ชื่อของคุณ"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Discord *
                      </label>
                      <Input
                        placeholder="username#0000"
                        value={formData.discord}
                        onChange={(e) =>
                          setFormData({ ...formData, discord: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        อีเมล
                      </label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        งบประมาณ (บาท)
                      </label>
                      <Input
                        type="number"
                        placeholder="1000"
                        value={formData.budget}
                        onChange={(e) =>
                          setFormData({ ...formData, budget: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      รายละเอียดงาน *
                    </label>
                    <textarea
                      className="w-full h-32 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      placeholder="อธิบายรายละเอียดของ UI ที่ต้องการ..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      ไฟล์แนบ (รูปอ้างอิง)
                    </label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-red-500/50 transition-colors">
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
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                        <span className="text-gray-400 text-sm">
                          คลิกเพื่ออัพโหลดไฟล์
                        </span>
                        <span className="text-gray-600 text-xs mt-1">
                          รองรับ PNG, JPG, GIF
                        </span>
                      </label>
                    </div>

                    {/* Attachments Preview */}
                    {attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg"
                          >
                            <span className="text-sm text-gray-300 truncate max-w-[150px]">
                              {file.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-gray-500 hover:text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full">
                    <Send className="w-5 h-5" />
                    ส่งคำขอ
                  </Button>
                </form>
              </Card>
            </motion.div>

            {/* Contact Info */}
            <div className="mt-8 text-center">
              <p className="text-gray-400 mb-4">หรือติดต่อเราโดยตรงผ่าน</p>
              <a
                href="https://discord.gg/qrstudio"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="secondary">
                  <MessageCircle className="w-5 h-5" />
                  Discord Server
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

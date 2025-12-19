"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Card } from "@/components/ui";

const sections = [
  {
    title: "1. ข้อมูลที่เราเก็บรวบรวม",
    content: "เราเก็บรวบรวมข้อมูลที่คุณให้โดยตรง เช่น ชื่อผู้ใช้ อีเมล และข้อมูลจาก Discord เมื่อคุณสร้างบัญชี รวมถึงข้อมูลการทำธุรกรรมเมื่อคุณซื้อสินค้า",
  },
  {
    title: "2. วิธีการใช้ข้อมูล",
    content: "เราใช้ข้อมูลของคุณเพื่อ: ให้บริการและปรับปรุงแพลตฟอร์ม, ดำเนินการธุรกรรม, ส่งการแจ้งเตือนและอัพเดท, ตอบคำถามและให้การสนับสนุน, ป้องกันการฉ้อโกงและรักษาความปลอดภัย",
  },
  {
    title: "3. การแชร์ข้อมูล",
    content: "เราไม่ขายหรือให้เช่าข้อมูลส่วนบุคคลของคุณ เราอาจแชร์ข้อมูลกับผู้ให้บริการที่เชื่อถือได้ (เช่น Stripe สำหรับการชำระเงิน) เพื่อดำเนินการบริการของเรา",
  },
  {
    title: "4. ความปลอดภัยของข้อมูล",
    content: "เราใช้มาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลของคุณ รวมถึงการเข้ารหัส SSL, การจัดเก็บรหัสผ่านแบบ hash และการควบคุมการเข้าถึง",
  },
  {
    title: "5. คุกกี้และเทคโนโลยีติดตาม",
    content: "เราใช้คุกกี้เพื่อปรับปรุงประสบการณ์ของคุณ รักษาเซสชันการเข้าสู่ระบบ และวิเคราะห์การใช้งานเว็บไซต์ คุณสามารถปิดการใช้งานคุกกี้ในเบราว์เซอร์ได้ แต่อาจส่งผลต่อฟังก์ชันบางอย่าง",
  },
  {
    title: "6. สิทธิ์ของคุณ",
    content: "คุณมีสิทธิ์: เข้าถึงข้อมูลส่วนบุคคลของคุณ, แก้ไขข้อมูลที่ไม่ถูกต้อง, ขอให้ลบข้อมูล, ยกเลิกการรับข่าวสารทางการตลาด",
  },
  {
    title: "7. การเก็บรักษาข้อมูล",
    content: "เราเก็บรักษาข้อมูลของคุณตราบเท่าที่จำเป็นสำหรับวัตถุประสงค์ที่เก็บรวบรวม หรือตามที่กฎหมายกำหนด ข้อมูลการทำธุรกรรมจะถูกเก็บรักษาเพื่อวัตถุประสงค์ทางบัญชีและภาษี",
  },
  {
    title: "8. บริการของบุคคลที่สาม",
    content: "เว็บไซต์ของเราอาจมีลิงก์ไปยังบริการของบุคคลที่สาม เราไม่รับผิดชอบต่อนโยบายความเป็นส่วนตัวของเว็บไซต์เหล่านั้น กรุณาอ่านนโยบายของพวกเขาก่อนใช้บริการ",
  },
  {
    title: "9. การเปลี่ยนแปลงนโยบาย",
    content: "เราอาจอัพเดทนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงจะถูกโพสต์บนหน้านี้พร้อมวันที่อัพเดท การใช้งานต่อเนื่องหลังจากการเปลี่ยนแปลงถือว่าคุณยอมรับนโยบายใหม่",
  },
  {
    title: "10. ติดต่อเรา",
    content: "หากคุณมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ กรุณาติดต่อเราที่ privacy@qrstudio.com หรือผ่าน Discord",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับหน้าแรก
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">นโยบายความเป็นส่วนตัว</h1>
              <p className="text-gray-400">อัพเดทล่าสุด: 1 ธันวาคม 2024</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 md:p-8">
            <p className="text-gray-400 mb-8">
              QR Studio ให้ความสำคัญกับความเป็นส่วนตัวของคุณ นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ และปกป้องข้อมูลของคุณ
            </p>

            <div className="space-y-6">
              {sections.map((section, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className="pb-6 border-b border-white/10 last:border-0"
                >
                  <h2 className="text-lg font-semibold text-white mb-3">
                    {section.title}
                  </h2>
                  <p className="text-gray-400 leading-relaxed">
                    {section.content}
                  </p>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

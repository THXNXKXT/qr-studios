"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { Card } from "@/components/ui";

const sections = [
  {
    title: "1. การยอมรับข้อกำหนด",
    content: "โดยการเข้าถึงและใช้งานเว็บไซต์ QR Studio คุณยอมรับและตกลงที่จะปฏิบัติตามข้อกำหนดและเงื่อนไขเหล่านี้ หากคุณไม่เห็นด้วยกับส่วนใดส่วนหนึ่งของข้อกำหนดเหล่านี้ คุณไม่ควรใช้บริการของเรา",
  },
  {
    title: "2. คำอธิบายบริการ",
    content: "QR Studio ให้บริการจำหน่าย Script และ UI สำหรับ FiveM รวมถึงบริการรับทำ UI ตามความต้องการ สินค้าทั้งหมดเป็นผลิตภัณฑ์ดิจิทัลที่จะถูกส่งมอบผ่านระบบ License Key",
  },
  {
    title: "3. บัญชีผู้ใช้",
    content: "คุณต้องสร้างบัญชีผ่าน Discord เพื่อใช้บริการของเรา คุณมีหน้าที่รับผิดชอบในการรักษาความปลอดภัยของบัญชีและรหัสผ่านของคุณ QR Studio จะไม่รับผิดชอบต่อความสูญเสียหรือความเสียหายที่เกิดจากการไม่ปฏิบัติตามข้อกำหนดด้านความปลอดภัยนี้",
  },
  {
    title: "4. การซื้อและการชำระเงิน",
    content: "การซื้อทั้งหมดจะถูกดำเนินการผ่าน Stripe หรือยอดเงินในบัญชี ราคาทั้งหมดแสดงเป็นสกุลเงินบาท (THB) และรวมภาษีมูลค่าเพิ่มแล้ว เมื่อการชำระเงินสำเร็จ คุณจะได้รับ License Key ทางอีเมลและในหน้า Dashboard",
  },
  {
    title: "5. License และการใช้งาน",
    content: "License ที่ซื้อมีไว้สำหรับใช้งานส่วนบุคคลหรือในเซิร์ฟเวอร์เดียวเท่านั้น ห้ามแจกจ่าย ขายต่อ หรือแชร์ License Key กับผู้อื่น การละเมิดข้อกำหนดนี้อาจส่งผลให้ License ถูกยกเลิก",
  },
  {
    title: "6. นโยบายการคืนเงิน",
    content: "เนื่องจากสินค้าของเราเป็นผลิตภัณฑ์ดิจิทัล เราไม่รับคืนเงินหลังจากที่ License Key ถูกส่งมอบแล้ว อย่างไรก็ตาม หากสินค้ามีข้อบกพร่องหรือไม่ทำงานตามที่อธิบายไว้ กรุณาติดต่อฝ่ายสนับสนุนภายใน 7 วัน",
  },
  {
    title: "7. ทรัพย์สินทางปัญญา",
    content: "สินค้าทั้งหมดที่จำหน่ายบน QR Studio เป็นทรัพย์สินทางปัญญาของ QR Studio หรือผู้สร้างที่ได้รับอนุญาต ห้ามทำซ้ำ แจกจ่าย หรือดัดแปลงโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
  },
  {
    title: "8. การจำกัดความรับผิดชอบ",
    content: "QR Studio ไม่รับประกันว่าบริการจะไม่มีข้อผิดพลาดหรือไม่หยุดชะงัก เราจะไม่รับผิดชอบต่อความเสียหายทางอ้อม ความเสียหายพิเศษ หรือความเสียหายที่เป็นผลสืบเนื่อง",
  },
  {
    title: "9. การเปลี่ยนแปลงข้อกำหนด",
    content: "เราขอสงวนสิทธิ์ในการแก้ไขข้อกำหนดเหล่านี้ได้ตลอดเวลา การเปลี่ยนแปลงจะมีผลทันทีเมื่อโพสต์บนเว็บไซต์ การใช้งานต่อเนื่องหลังจากการเปลี่ยนแปลงถือว่าคุณยอมรับข้อกำหนดใหม่",
  },
  {
    title: "10. การติดต่อ",
    content: "หากคุณมีคำถามเกี่ยวกับข้อกำหนดเหล่านี้ กรุณาติดต่อเราผ่าน Discord หรืออีเมล support@qrstudio.com",
  },
];

export default function TermsPage() {
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
            <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ข้อกำหนดการใช้งาน</h1>
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
              กรุณาอ่านข้อกำหนดการใช้งานเหล่านี้อย่างละเอียดก่อนใช้บริการของ QR Studio
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

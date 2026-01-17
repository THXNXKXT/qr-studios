"use client";

import Link from "next/link";
import { CheckCircle, Download } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { useTranslation } from "react-i18next";

interface License {
  id: string;
  licenseKey: string;
  status: string;
  product: {
    name: string;
  };
}

interface MyLicensesProps {
  licenses: License[];
}

import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export function MyLicenses({ licenses }: MyLicensesProps) {
  const { t } = useTranslation("common");

  return (
    <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white" suppressHydrationWarning>{t("dashboard.recent.licenses")}</h3>
            <p className="text-xs text-gray-500" suppressHydrationWarning>{t("dashboard.recent.licenses_subtitle", "Manage and download latest 3")}</p>
          </div>
        </div>
        <Link href="/dashboard/licenses">
          <Button variant="secondary" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 rounded-xl px-4">
            {t("common.view_all", "View All")}
          </Button>
        </Link>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {licenses.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border-2 border-dashed border-white/5 bg-white/2">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
              <CheckCircle className="w-8 h-8 text-gray-700 opacity-20" />
            </div>
            <p className="text-gray-500" suppressHydrationWarning>{t("dashboard.history.no_licenses", "No licenses found")}</p>
          </div>
        ) : (
          licenses.slice(0, 3).map((license) => (
            <motion.div
              key={license.id}
              variants={item}
              className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 transition-all duration-500 group shadow-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 border border-white/5">
                  <CheckCircle className="w-5 h-5 text-red-500 group-hover:text-red-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white group-hover:text-red-400 transition-colors">
                    {license.product.name}
                  </p>
                  <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-60">
                    {license.licenseKey.substring(0, 6)}...
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="gap-2 bg-white/5 border-white/10 hover:bg-red-600 hover:border-red-500 hover:text-white transition-all rounded-xl h-9 px-3 text-xs">
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline" suppressHydrationWarning>{t("common.download", "Download")}</span>
              </Button>
            </motion.div>
          ))
        )}
      </motion.div>
    </Card>
  );
}

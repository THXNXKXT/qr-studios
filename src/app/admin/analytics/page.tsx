"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  User,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Tag,
  Loader2,
  ImageOff,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, Badge } from "@/components/ui";
import { formatPrice, cn } from "@/lib/utils";
import { adminApi } from "@/lib/api";

export default function AdminAnalyticsPage() {
  const { t } = useTranslation("admin");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await adminApi.getAnalytics();
      if (res && (res as any).success) {
        setData((res as any).data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const stats = useMemo(() => [
    {
      label: t("analytics.stats.revenue"),
      value: formatPrice(data?.summary?.totalRevenue || 0),
      icon: DollarSign,
      color: "text-red-400",
    },
    {
      label: t("analytics.stats.orders"),
      value: (data?.summary?.totalOrders || 0).toLocaleString(),
      icon: ShoppingCart,
      color: "text-red-400",
    },
    {
      label: t("analytics.stats.users"),
      value: (data?.summary?.totalUsers || 0).toLocaleString(),
      icon: Users,
      color: "text-red-400",
    },
    {
      label: t("analytics.stats.avg_order"),
      value: formatPrice(data?.summary?.avgOrderValue || 0),
      icon: Package,
      color: "text-red-300",
    },
  ], [data, t]);

  const {
    revenueData = [],
    dailyRevenueData = [],
    categoryData = [],
    userGrowthData = [],
    hourlyOrdersData = [],
    paymentMethodData = [],
    promoPerformance = [],
    productSales = [],
    categoryRevenueData = [],
    customerInsightsData = { newVsReturning: [], avgOrdersByCustomerType: [], topBuyers: [] },
    geographicData = [],
    conversionData = []
  } = data?.charts || {};

  const safeRevenueData = useMemo(() => Array.isArray(revenueData) ? revenueData : [], [revenueData]);
  const safeDailyRevenueData = useMemo(() => Array.isArray(dailyRevenueData) ? dailyRevenueData : [], [dailyRevenueData]);
  const safeCategoryData = useMemo(() => Array.isArray(categoryData) ? categoryData : [], [categoryData]);
  const safeUserGrowthData = useMemo(() => Array.isArray(userGrowthData) ? userGrowthData : [], [userGrowthData]);
  const safeHourlyOrdersData = useMemo(() => Array.isArray(hourlyOrdersData) ? hourlyOrdersData : [], [hourlyOrdersData]);
  const safePaymentMethodData = useMemo(() => Array.isArray(paymentMethodData) ? paymentMethodData : [], [paymentMethodData]);
  const safePromoPerformance = useMemo(() => Array.isArray(promoPerformance) ? promoPerformance : [], [promoPerformance]);
  const safeProductSales = useMemo(() => Array.isArray(productSales) ? productSales : [], [productSales]);
  const safeCategoryRevenueData = useMemo(() => Array.isArray(categoryRevenueData) ? categoryRevenueData : [], [categoryRevenueData]);
  const safeGeographicData = useMemo(() => Array.isArray(geographicData) ? geographicData : [], [geographicData]);
  const safeConversionData = useMemo(() => Array.isArray(conversionData) ? conversionData : [], [conversionData]);
  const safeNewVsReturning = useMemo(() => Array.isArray(customerInsightsData?.newVsReturning) ? customerInsightsData.newVsReturning : [], [customerInsightsData]);
  const safeTopBuyers = useMemo(() => Array.isArray(customerInsightsData?.topBuyers) ? customerInsightsData.topBuyers : [], [customerInsightsData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">{t("analytics.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[160px] -z-10" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">{t("analytics.title")}</h1>
          <p className="text-gray-400 mt-1">{t("analytics.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 border-white/5 bg-white/2 backdrop-blur-md hover:border-red-500/30 transition-all duration-500 group shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-500 shadow-inner">
                  <stat.icon className="w-7 h-7 text-red-500 group-hover:text-red-400 transition-colors" />
                </div>
              </div>
              <div className="relative z-10">
                <p className={cn(
                  "text-3xl font-black tracking-tighter mb-1 transition-colors duration-500",
                  (stat.label.includes("รายได้") || stat.label.includes("ยอดขาย") || stat.value.toString().startsWith("฿")) ? "text-red-500" : "text-white group-hover:text-red-400"
                )}>{stat.value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-black">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.revenue_monthly")}</h2>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeRevenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v: number) => `฿${(v/1000).toFixed(0)}k`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "transparent", 
                  border: "none", 
                  color: "#fff",
                  boxShadow: "none"
                }} 
                itemStyle={{ color: "#fff" }}
                formatter={(v: any) => [formatPrice(v), "รายได้"]} 
              />
              <Area type="monotone" dataKey="revenue" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.user_growth")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeUserGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "transparent", 
                    border: "none",
                    color: "#fff",
                    boxShadow: "none"
                  }} 
                  itemStyle={{ color: "#fff" }}
                />
                <Area type="monotone" dataKey="users" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                <Area type="monotone" dataKey="newUsers" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.hourly_orders")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={safeHourlyOrdersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="hour" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} />
                <Tooltip 
                  cursor={false}
                  contentStyle={{ 
                    backgroundColor: "transparent", 
                    border: "none",
                    color: "#fff",
                    boxShadow: "none"
                  }} 
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="orders" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.category_revenue")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeCategoryRevenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="month" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={10} tickFormatter={(v: number) => `฿${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "transparent", 
                    border: "none",
                    color: "#fff",
                    boxShadow: "none"
                  }} 
                  itemStyle={{ color: "#fff" }}
                />
                <Legend />
                <Area type="monotone" dataKey="Script" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                <Area type="monotone" dataKey="UI" stroke="#dc2626" fill="#dc2626" fillOpacity={0.1} />
                <Area type="monotone" dataKey="Bundle" stroke="#991b1b" fill="#991b1b" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.payment_methods")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={safePaymentMethodData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                  {safePaymentMethodData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "transparent", 
                    border: "none",
                    color: "#fff",
                    boxShadow: "none"
                  }} 
                  itemStyle={{ color: "#fff" }}
                  formatter={(v: any) => [`${v}%`, "สัดส่วน"]} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.table.best_sellers")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                <th className="px-8 py-5 text-left border-b border-white/5">{t("analytics.table.product")}</th>
                <th className="px-8 py-5 text-left border-b border-white/5">{t("analytics.table.category")}</th>
                <th className="px-8 py-5 text-right border-b border-white/5">{t("analytics.table.price")}</th>
                <th className="px-8 py-5 text-right border-b border-white/5">{t("analytics.table.sold")}</th>
                <th className="px-8 py-5 text-right border-b border-white/5">{t("analytics.table.revenue")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {safeProductSales.map((product: any) => (
                <tr key={product.name} className="hover:bg-white/2 transition-colors group">
                  <td className="px-8 py-6 font-bold text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex flex-col items-center justify-center overflow-hidden shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge className={cn("px-3 py-0.5 rounded-lg border-none font-black text-[10px] uppercase tracking-widest", product.category === "SCRIPT" ? "bg-red-600 text-white" : "bg-white/10 text-gray-300")}>{product.category}</Badge>
                  </td>
                  <td className="px-8 py-6 text-right font-mono text-sm text-gray-400">{formatPrice(product.price)}</td>
                  <td className="px-8 py-6 text-right font-bold text-white">{product.sales}</td>
                  <td className="px-8 py-6 text-right font-black text-red-500">{formatPrice(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl h-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.customer_type")}</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={safeNewVsReturning} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                  {safeNewVsReturning.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "transparent", 
                    border: "none",
                    color: "#fff",
                    boxShadow: "none"
                  }} 
                  itemStyle={{ color: "#fff" }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.top_buyers")}</h2>
          <div className="space-y-4">
            {safeTopBuyers.map((buyer: any) => (
              <div key={buyer.name} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 overflow-hidden">
                    {buyer.avatar ? (
                      <img src={buyer.avatar} alt={buyer.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-white">{buyer.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">{buyer.orders} Orders</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-red-500">{formatPrice(buyer.spent)}</p>
                  <p className="text-[10px] text-gray-600 uppercase font-black">Total Spent</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
        <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.conversion")}</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={safeConversionData} margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" stroke="#666" fontSize={12} width={100} />
              <Tooltip cursor={false} contentStyle={{ backgroundColor: "transparent", border: "none", boxShadow: "none" }} />
              <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.promo_performance")}</h2>
          <div className="space-y-4">
            {safePromoPerformance.map((promo: any) => (
              <div key={promo.code} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                <div>
                  <code className="text-red-400 font-mono font-black text-lg">{promo.code}</code>
                  <p className="text-[10px] text-gray-500 uppercase font-black">{promo.uses} Uses</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-red-500">{formatPrice(promo.revenue)}</p>
                  <p className="text-[10px] text-gray-600 uppercase font-black">Generated Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 border-white/5 bg-white/2 backdrop-blur-sm shadow-2xl relative overflow-hidden h-full">
          <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-red-600 to-transparent" />
          <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">{t("analytics.charts.geo")}</h2>
          <div className="space-y-6">
            {safeGeographicData.map((item: any) => (
              <div key={item.country} className="flex items-center gap-6 group/geo">
                <div className="w-24 text-sm font-bold text-gray-400">{item.country}</div>
                <div className="flex-1 relative h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${item.percentage}%` }} transition={{ duration: 1.5 }} className="h-full bg-linear-to-r from-red-600 via-red-500 to-red-400 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
                </div>
                <div className="w-24 text-right text-sm font-black text-white">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
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
import { Card, Button, Badge } from "@/components/ui";
import { formatPrice } from "@/lib/utils";

// Mock data for charts
const revenueData = [
  { name: "ม.ค.", revenue: 45000, orders: 75 },
  { name: "ก.พ.", revenue: 52000, orders: 82 },
  { name: "มี.ค.", revenue: 48000, orders: 78 },
  { name: "เม.ย.", revenue: 61000, orders: 95 },
  { name: "พ.ค.", revenue: 55000, orders: 88 },
  { name: "มิ.ย.", revenue: 67000, orders: 102 },
  { name: "ก.ค.", revenue: 72000, orders: 115 },
  { name: "ส.ค.", revenue: 69000, orders: 108 },
  { name: "ก.ย.", revenue: 78000, orders: 125 },
  { name: "ต.ค.", revenue: 85000, orders: 138 },
  { name: "พ.ย.", revenue: 92000, orders: 152 },
  { name: "ธ.ค.", revenue: 105000, orders: 175 },
];

const dailyRevenueData = [
  { name: "1", revenue: 3200 },
  { name: "2", revenue: 2800 },
  { name: "3", revenue: 4100 },
  { name: "4", revenue: 3600 },
  { name: "5", revenue: 5200 },
  { name: "6", revenue: 4800 },
  { name: "7", revenue: 6100 },
  { name: "8", revenue: 5500 },
  { name: "9", revenue: 4200 },
  { name: "10", revenue: 3800 },
  { name: "11", revenue: 4500 },
  { name: "12", revenue: 5800 },
  { name: "13", revenue: 6200 },
  { name: "14", revenue: 7100 },
];

const categoryData = [
  { name: "Script", value: 45, color: "#ef4444" },
  { name: "UI", value: 35, color: "#f97316" },
  { name: "Bundle", value: 20, color: "#eab308" },
];

const topProductsData = [
  { name: "Advanced Inventory", sales: 156, revenue: 93444, price: 599, category: "Script", growth: 12.5 },
  { name: "Modern HUD UI", sales: 124, revenue: 49476, price: 399, category: "UI", growth: 8.2 },
  { name: "Vehicle Shop UI", sales: 98, revenue: 29302, price: 299, category: "UI", growth: 15.3 },
  { name: "Phone UI", sales: 87, revenue: 30363, price: 349, category: "UI", growth: -2.1 },
  { name: "Admin Panel", sales: 65, revenue: 51935, price: 799, category: "Script", growth: 22.8 },
  { name: "Garage System", sales: 54, revenue: 26946, price: 499, category: "Script", growth: 5.6 },
  { name: "Banking UI", sales: 48, revenue: 16752, price: 349, category: "UI", growth: 18.4 },
  { name: "Complete Bundle", sales: 32, revenue: 47968, price: 1499, category: "Bundle", growth: 35.2 },
];

// Product performance over time
const productPerformanceData = [
  { month: "ม.ค.", "Advanced Inventory": 12, "Modern HUD UI": 8, "Vehicle Shop UI": 6, "Phone UI": 5, "Admin Panel": 4 },
  { month: "ก.พ.", "Advanced Inventory": 14, "Modern HUD UI": 10, "Vehicle Shop UI": 8, "Phone UI": 7, "Admin Panel": 5 },
  { month: "มี.ค.", "Advanced Inventory": 11, "Modern HUD UI": 9, "Vehicle Shop UI": 7, "Phone UI": 6, "Admin Panel": 4 },
  { month: "เม.ย.", "Advanced Inventory": 15, "Modern HUD UI": 12, "Vehicle Shop UI": 9, "Phone UI": 8, "Admin Panel": 6 },
  { month: "พ.ค.", "Advanced Inventory": 13, "Modern HUD UI": 11, "Vehicle Shop UI": 8, "Phone UI": 7, "Admin Panel": 5 },
  { month: "มิ.ย.", "Advanced Inventory": 16, "Modern HUD UI": 13, "Vehicle Shop UI": 10, "Phone UI": 9, "Admin Panel": 7 },
  { month: "ก.ค.", "Advanced Inventory": 18, "Modern HUD UI": 14, "Vehicle Shop UI": 11, "Phone UI": 10, "Admin Panel": 8 },
  { month: "ส.ค.", "Advanced Inventory": 15, "Modern HUD UI": 12, "Vehicle Shop UI": 9, "Phone UI": 8, "Admin Panel": 6 },
  { month: "ก.ย.", "Advanced Inventory": 17, "Modern HUD UI": 15, "Vehicle Shop UI": 12, "Phone UI": 11, "Admin Panel": 9 },
  { month: "ต.ค.", "Advanced Inventory": 19, "Modern HUD UI": 16, "Vehicle Shop UI": 13, "Phone UI": 12, "Admin Panel": 10 },
  { month: "พ.ย.", "Advanced Inventory": 21, "Modern HUD UI": 18, "Vehicle Shop UI": 15, "Phone UI": 14, "Admin Panel": 11 },
  { month: "ธ.ค.", "Advanced Inventory": 25, "Modern HUD UI": 20, "Vehicle Shop UI": 18, "Phone UI": 15, "Admin Panel": 12 },
];

// Revenue by product category over time
const categoryRevenueData = [
  { month: "ม.ค.", Script: 28000, UI: 15000, Bundle: 8000 },
  { month: "ก.พ.", Script: 32000, UI: 18000, Bundle: 10000 },
  { month: "มี.ค.", Script: 29000, UI: 16000, Bundle: 9000 },
  { month: "เม.ย.", Script: 38000, UI: 22000, Bundle: 12000 },
  { month: "พ.ค.", Script: 35000, UI: 20000, Bundle: 11000 },
  { month: "มิ.ย.", Script: 42000, UI: 25000, Bundle: 14000 },
  { month: "ก.ค.", Script: 48000, UI: 28000, Bundle: 16000 },
  { month: "ส.ค.", Script: 45000, UI: 26000, Bundle: 15000 },
  { month: "ก.ย.", Script: 52000, UI: 30000, Bundle: 18000 },
  { month: "ต.ค.", Script: 58000, UI: 34000, Bundle: 20000 },
  { month: "พ.ย.", Script: 65000, UI: 38000, Bundle: 22000 },
  { month: "ธ.ค.", Script: 72000, UI: 42000, Bundle: 25000 },
];

// Customer insights
const customerInsightsData = {
  newVsReturning: [
    { name: "ลูกค้าใหม่", value: 42, color: "#22c55e" },
    { name: "ลูกค้าเก่า", value: 58, color: "#6366f1" },
  ],
  avgOrdersByCustomerType: [
    { type: "ลูกค้าใหม่", avgOrders: 1.2, avgSpend: 520 },
    { type: "ลูกค้าเก่า", avgOrders: 3.8, avgSpend: 1850 },
  ],
  topBuyers: [
    { name: "ServerOwner99", orders: 15, spent: 12450, lastOrder: "2 วันที่แล้ว" },
    { name: "FiveMDev", orders: 12, spent: 9800, lastOrder: "1 วันที่แล้ว" },
    { name: "GamerTH", orders: 10, spent: 7500, lastOrder: "3 วันที่แล้ว" },
    { name: "ProServer", orders: 8, spent: 6200, lastOrder: "5 วันที่แล้ว" },
    { name: "RPMaster", orders: 7, spent: 5100, lastOrder: "1 สัปดาห์ที่แล้ว" },
  ],
};

// Geographic data
const geographicData = [
  { country: "ไทย", orders: 850, revenue: 510000, percentage: 65 },
  { country: "เวียดนาม", orders: 180, revenue: 108000, percentage: 14 },
  { country: "อินโดนีเซีย", orders: 120, revenue: 72000, percentage: 9 },
  { country: "ฟิลิปปินส์", orders: 95, revenue: 57000, percentage: 7 },
  { country: "อื่นๆ", orders: 65, revenue: 39000, percentage: 5 },
];

// Promo code performance
const promoCodePerformance = [
  { code: "WELCOME10", uses: 156, revenue: 45000, avgDiscount: 52 },
  { code: "SAVE50", uses: 45, revenue: 28000, avgDiscount: 50 },
  { code: "VIP20", uses: 32, revenue: 35000, avgDiscount: 180 },
  { code: "FLASH100", uses: 28, revenue: 15000, avgDiscount: 100 },
];

const userGrowthData = [
  { name: "ม.ค.", users: 120, newUsers: 45 },
  { name: "ก.พ.", users: 165, newUsers: 52 },
  { name: "มี.ค.", users: 210, newUsers: 48 },
  { name: "เม.ย.", users: 280, newUsers: 75 },
  { name: "พ.ค.", users: 350, newUsers: 72 },
  { name: "มิ.ย.", users: 420, newUsers: 78 },
  { name: "ก.ค.", users: 510, newUsers: 95 },
  { name: "ส.ค.", users: 620, newUsers: 115 },
  { name: "ก.ย.", users: 750, newUsers: 135 },
  { name: "ต.ค.", users: 890, newUsers: 145 },
  { name: "พ.ย.", users: 1050, newUsers: 165 },
  { name: "ธ.ค.", users: 1234, newUsers: 188 },
];

const paymentMethodData = [
  { name: "Stripe", value: 65, color: "#6366f1" },
  { name: "Balance", value: 30, color: "#22c55e" },
  { name: "PromptPay", value: 5, color: "#06b6d4" },
];

const hourlyOrdersData = [
  { hour: "00", orders: 2 },
  { hour: "01", orders: 1 },
  { hour: "02", orders: 0 },
  { hour: "03", orders: 1 },
  { hour: "04", orders: 0 },
  { hour: "05", orders: 1 },
  { hour: "06", orders: 3 },
  { hour: "07", orders: 5 },
  { hour: "08", orders: 8 },
  { hour: "09", orders: 12 },
  { hour: "10", orders: 15 },
  { hour: "11", orders: 18 },
  { hour: "12", orders: 14 },
  { hour: "13", orders: 16 },
  { hour: "14", orders: 19 },
  { hour: "15", orders: 22 },
  { hour: "16", orders: 25 },
  { hour: "17", orders: 28 },
  { hour: "18", orders: 32 },
  { hour: "19", orders: 35 },
  { hour: "20", orders: 38 },
  { hour: "21", orders: 30 },
  { hour: "22", orders: 18 },
  { hour: "23", orders: 8 },
];

const conversionData = [
  { name: "เข้าชม", value: 10000, fill: "#ef4444" },
  { name: "ดูสินค้า", value: 6500, fill: "#f97316" },
  { name: "เพิ่มตะกร้า", value: 2800, fill: "#eab308" },
  { name: "ชำระเงิน", value: 1200, fill: "#22c55e" },
];

type TimeRange = "7d" | "30d" | "90d" | "1y";

export default function AdminAnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");

  const stats = [
    {
      label: "รายได้รวม",
      value: "฿829,000",
      change: "+18.2%",
      trend: "up",
      icon: DollarSign,
      color: "text-green-400",
      bg: "bg-green-500/20",
    },
    {
      label: "คำสั่งซื้อ",
      value: "1,333",
      change: "+12.5%",
      trend: "up",
      icon: ShoppingCart,
      color: "text-blue-400",
      bg: "bg-blue-500/20",
    },
    {
      label: "ผู้ใช้ใหม่",
      value: "1,234",
      change: "+25.3%",
      trend: "up",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/20",
    },
    {
      label: "ยอดขายเฉลี่ย",
      value: "฿621",
      change: "-3.2%",
      trend: "down",
      icon: Package,
      color: "text-orange-400",
      bg: "bg-orange-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400">วิเคราะห์ข้อมูลและประสิทธิภาพของระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7d", "30d", "90d", "1y"] as TimeRange[]).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "ghost"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === "7d" ? "7 วัน" : range === "30d" ? "30 วัน" : range === "90d" ? "90 วัน" : "1 ปี"}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    stat.trend === "up" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-gray-400">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">รายได้รายเดือน</h2>
              <p className="text-sm text-gray-400">เปรียบเทียบรายได้และจำนวนคำสั่งซื้อ</p>
            </div>
            <Badge variant="success">+18.2% จากปีที่แล้ว</Badge>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: number, name: string) => [
                    name === "revenue" ? formatPrice(value) : value,
                    name === "revenue" ? "รายได้" : "คำสั่งซื้อ",
                  ]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="รายได้"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Line type="monotone" dataKey="orders" name="คำสั่งซื้อ" stroke="#22c55e" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">รายได้รายวัน (14 วันล่าสุด)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                    formatter={(value: number) => [formatPrice(value), "รายได้"]}
                  />
                  <Bar dataKey="revenue" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">สัดส่วนหมวดหมู่สินค้า</h2>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={{ stroke: "#666" }}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#262626", border: "1px solid #444", borderRadius: "8px", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: number) => [`${value}%`, "สัดส่วน"]}
                  />
                  <Legend wrapperStyle={{ color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* User Growth */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">การเติบโตของผู้ใช้</h2>
              <p className="text-sm text-gray-400">จำนวนผู้ใช้ทั้งหมดและผู้ใช้ใหม่</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  name="ผู้ใช้ทั้งหมด"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6" }}
                />
                <Line
                  type="monotone"
                  dataKey="newUsers"
                  name="ผู้ใช้ใหม่"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: "#22c55e" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">คำสั่งซื้อตามช่วงเวลา</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyOrdersData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="hour" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                    formatter={(value: number) => [value, "คำสั่งซื้อ"]}
                    labelFormatter={(label) => `${label}:00 น.`}
                  />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colorOrders)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">วิธีการชำระเงิน</h2>
            <div className="h-64 flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={{ stroke: "#666" }}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#262626", border: "1px solid #444", borderRadius: "8px", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                    formatter={(value: number) => [`${value}%`, "สัดส่วน"]}
                  />
                  <Legend wrapperStyle={{ color: "#fff" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Product Sales Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">รายละเอียดยอดขายสินค้า</h2>
              <p className="text-sm text-gray-400">ข้อมูลยอดขายและรายได้แยกตามสินค้า</p>
            </div>
            <Badge variant="success">อัพเดทล่าสุด: วันนี้</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-sm font-medium text-gray-400">#</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-400">สินค้า</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-400">หมวดหมู่</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-400">ราคา</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-400">ขายได้ (ชิ้น)</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-400">รายได้</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-400">% รายได้รวม</th>
                  <th className="text-right p-3 text-sm font-medium text-gray-400">การเติบโต</th>
                </tr>
              </thead>
              <tbody>
                {topProductsData.map((product, index) => {
                  const totalRevenue = topProductsData.reduce((sum, p) => sum + p.revenue, 0);
                  const revenuePercentage = ((product.revenue / totalRevenue) * 100).toFixed(1);
                  return (
                    <tr key={product.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                          index === 1 ? "bg-gray-400/20 text-gray-300" :
                          index === 2 ? "bg-orange-500/20 text-orange-400" :
                          "bg-white/10 text-gray-400"
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-white">{product.name}</p>
                      </td>
                      <td className="p-3">
                        <Badge variant={
                          product.category === "Script" ? "destructive" :
                          product.category === "UI" ? "warning" : "success"
                        }>
                          {product.category}
                        </Badge>
                      </td>
                      <td className="p-3 text-right text-gray-300">{formatPrice(product.price)}</td>
                      <td className="p-3 text-right">
                        <span className="font-semibold text-white">{product.sales}</span>
                        <span className="text-gray-500 text-sm ml-1">ชิ้น</span>
                      </td>
                      <td className="p-3 text-right font-semibold text-green-400">{formatPrice(product.revenue)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${revenuePercentage}%` }}
                            />
                          </div>
                          <span className="text-gray-400 text-sm w-12">{revenuePercentage}%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`flex items-center justify-end gap-1 ${
                          product.growth >= 0 ? "text-green-400" : "text-red-400"
                        }`}>
                          {product.growth >= 0 ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                          {Math.abs(product.growth)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-white/5">
                  <td colSpan={4} className="p-3 font-semibold text-white">รวมทั้งหมด</td>
                  <td className="p-3 text-right font-bold text-white">
                    {topProductsData.reduce((sum, p) => sum + p.sales, 0)} ชิ้น
                  </td>
                  <td className="p-3 text-right font-bold text-green-400">
                    {formatPrice(topProductsData.reduce((sum, p) => sum + p.revenue, 0))}
                  </td>
                  <td className="p-3 text-right text-gray-400">100%</td>
                  <td className="p-3 text-right text-green-400">+12.8%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Product Performance Over Time */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">ยอดขายสินค้าตามเวลา</h2>
              <p className="text-sm text-gray-400">เปรียบเทียบยอดขายสินค้า Top 5 รายเดือน</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                />
                <Legend />
                <Line type="monotone" dataKey="Advanced Inventory" stroke="#ef4444" strokeWidth={2} />
                <Line type="monotone" dataKey="Modern HUD UI" stroke="#f97316" strokeWidth={2} />
                <Line type="monotone" dataKey="Vehicle Shop UI" stroke="#eab308" strokeWidth={2} />
                <Line type="monotone" dataKey="Phone UI" stroke="#22c55e" strokeWidth={2} />
                <Line type="monotone" dataKey="Admin Panel" stroke="#6366f1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>

      {/* Category Revenue & Top Products Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Revenue Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">รายได้ตามหมวดหมู่</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={categoryRevenueData}>
                  <defs>
                    <linearGradient id="colorScript" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorUI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBundle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#666" />
                  <YAxis stroke="#666" tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                    formatter={(value: number) => [formatPrice(value), ""]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="Script" stroke="#ef4444" fillOpacity={1} fill="url(#colorScript)" />
                  <Area type="monotone" dataKey="UI" stroke="#f97316" fillOpacity={1} fill="url(#colorUI)" />
                  <Area type="monotone" dataKey="Bundle" stroke="#eab308" fillOpacity={1} fill="url(#colorBundle)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Top Products Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">สินค้าขายดี (กราฟ)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData.slice(0, 5)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis type="number" stroke="#666" />
                  <YAxis dataKey="name" type="category" stroke="#666" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px" }}
                    formatter={(value: number, name: string) => [
                      name === "sales" ? `${value} ชิ้น` : formatPrice(value),
                      name === "sales" ? "ยอดขาย" : "รายได้",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="sales" name="ยอดขาย" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="revenue" name="รายได้" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Customer Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-6">ข้อมูลลูกค้า</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* New vs Returning */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">ลูกค้าใหม่ vs ลูกค้าเก่า</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerInsightsData.newVsReturning}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ value }) => `${value}%`}
                      labelLine={{ stroke: "#666" }}
                    >
                      {customerInsightsData.newVsReturning.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#262626", border: "1px solid #444", borderRadius: "8px", color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value: number) => [`${value}%`, ""]}
                    />
                    <Legend wrapperStyle={{ color: "#fff" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Customer Type Stats */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">พฤติกรรมการซื้อ</h3>
              <div className="space-y-4">
                {customerInsightsData.avgOrdersByCustomerType.map((item) => (
                  <div key={item.type} className="p-4 rounded-xl bg-white/5">
                    <p className="text-white font-medium mb-2">{item.type}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">ออเดอร์เฉลี่ย</p>
                        <p className="text-lg font-bold text-white">{item.avgOrders}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">ใช้จ่ายเฉลี่ย</p>
                        <p className="text-lg font-bold text-green-400">{formatPrice(item.avgSpend)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Buyers */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">ลูกค้าที่ซื้อมากที่สุด</h3>
              <div className="space-y-2">
                {customerInsightsData.topBuyers.map((buyer, index) => (
                  <div key={buyer.name} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? "bg-yellow-500/20 text-yellow-400" :
                        index === 1 ? "bg-gray-400/20 text-gray-300" :
                        index === 2 ? "bg-orange-500/20 text-orange-400" :
                        "bg-white/10 text-gray-400"
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm text-white">{buyer.name}</p>
                        <p className="text-xs text-gray-500">{buyer.orders} ออเดอร์</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-400">{formatPrice(buyer.spent)}</p>
                      <p className="text-xs text-gray-500">{buyer.lastOrder}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Geographic & Promo Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">การกระจายตามภูมิภาค</h2>
            <div className="space-y-3">
              {geographicData.map((item, index) => (
                <div key={item.country} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-white">{item.country}</div>
                  <div className="flex-1">
                    <div className="h-6 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full bg-linear-to-r from-red-500 to-orange-500 rounded-full"
                      />
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-sm font-semibold text-white">{item.percentage}%</p>
                    <p className="text-xs text-gray-500">{item.orders} ออเดอร์</p>
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-sm font-semibold text-green-400">{formatPrice(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Promo Code Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-white mb-6">ประสิทธิภาพโค้ดส่วนลด</h2>
            <div className="space-y-3">
              {promoCodePerformance.map((promo) => (
                <div key={promo.code} className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <code className="text-red-400 font-mono font-bold">{promo.code}</code>
                    <Badge variant="secondary">{promo.uses} ครั้ง</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">รายได้ที่เกิด</p>
                      <p className="font-semibold text-green-400">{formatPrice(promo.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ส่วนลดเฉลี่ย</p>
                      <p className="font-semibold text-white">{formatPrice(promo.avgDiscount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ROI</p>
                      <p className="font-semibold text-blue-400">
                        {((promo.revenue / (promo.uses * promo.avgDiscount)) * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Conversion Funnel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Conversion Funnel</h2>
          <div className="space-y-4">
            {conversionData.map((item, index) => {
              const percentage = index === 0 ? 100 : (item.value / conversionData[0].value) * 100;
              const prevPercentage = index === 0 ? 100 : (conversionData[index - 1].value / conversionData[0].value) * 100;
              const dropOff = index === 0 ? 0 : prevPercentage - percentage;
              
              return (
                <div key={item.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{item.value.toLocaleString()}</span>
                      <span className="text-white font-semibold">{percentage.toFixed(1)}%</span>
                      {dropOff > 0 && (
                        <span className="text-red-400 text-sm">-{dropOff.toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                  <div className="h-8 bg-white/10 rounded-lg overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                      className="h-full rounded-lg"
                      style={{ backgroundColor: item.fill }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <p className="text-green-400 font-medium">Conversion Rate: 12%</p>
            <p className="text-sm text-gray-400">จากผู้เข้าชมทั้งหมด 10,000 คน มี 1,200 คนที่ซื้อสินค้า</p>
          </div>
        </Card>
      </motion.div>

      {/* Additional Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-white mb-6">ตัวชี้วัดเพิ่มเติม</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { label: "Avg. Order Value", value: "฿621", change: "+5.2%" },
              { label: "Cart Abandonment", value: "57%", change: "-3.1%" },
              { label: "Repeat Customers", value: "34%", change: "+8.5%" },
              { label: "Refund Rate", value: "2.1%", change: "-0.5%" },
              { label: "License Activations", value: "1,245", change: "+12.3%" },
              { label: "Support Tickets", value: "45", change: "-15.2%" },
            ].map((metric) => (
              <div key={metric.label} className="p-4 rounded-xl bg-white/5">
                <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
                <p className="text-xl font-bold text-white">{metric.value}</p>
                <p className={`text-xs ${metric.change.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                  {metric.change}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

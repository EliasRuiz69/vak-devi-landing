"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type RevenuePoint = { fecha: string; label: string; total: number };
type ServicePoint = { nombre: string; count: number };
type HourPoint = { hora: string; count: number };

const fmtMXN = (v: number) => (v === 0 ? "$0" : `$${v.toLocaleString("es-MX")}`);

export default function DashboardCharts({
  revenueData,
  serviceData,
  hourData,
}: {
  revenueData: RevenuePoint[];
  serviceData: ServicePoint[];
  hourData: HourPoint[];
}) {
  return (
    <>
      {/* Revenue */}
      <div className="bg-white rounded-2xl border border-ink/8 p-5">
        <h2 className="font-serif text-sm text-ink mb-4">Ingresos — últimos 14 días</h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueData}
              barSize={12}
              margin={{ top: 0, right: 4, left: -16, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#2A123012" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "#2A123055" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={fmtMXN}
                tick={{ fontSize: 9, fill: "#2A123055" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v) => [fmtMXN(Number(v ?? 0)), "Ingresos"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #2A123018",
                  fontSize: 12,
                  boxShadow: "0 4px 16px #2A123010",
                }}
                cursor={{ fill: "#8B1EA008" }}
              />
              <Bar dataKey="total" fill="#8B1EA0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Service + Hour */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-ink/8 p-5">
          <h2 className="font-serif text-sm text-ink mb-4">Sesiones por servicio</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceData}
                layout="vertical"
                barSize={9}
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid horizontal={false} stroke="#2A123012" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: "#2A123055" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tick={{ fontSize: 8.5, fill: "#2A123070" }}
                  width={68}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [Number(v ?? 0), "Sesiones"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #2A123018",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "#9B4DAB08" }}
                />
                <Bar dataKey="count" fill="#9B4DAB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-ink/8 p-5">
          <h2 className="font-serif text-sm text-ink mb-4">Franjas horarias</h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={hourData}
                barSize={12}
                margin={{ top: 0, right: 0, left: -22, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="#2A123012" />
                <XAxis
                  dataKey="hora"
                  tick={{ fontSize: 9, fill: "#2A123055" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: "#2A123055" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  formatter={(v) => [Number(v ?? 0), "Sesiones"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #2A123018",
                    fontSize: 12,
                  }}
                  cursor={{ fill: "#7B2D8B08" }}
                />
                <Bar dataKey="count" fill="#7B2D8B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}

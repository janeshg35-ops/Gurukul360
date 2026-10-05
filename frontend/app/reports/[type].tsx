import { useLocalSearchParams } from "expo-router";
import { FileCsv, FilePdf } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { StackHeader } from "@/src/components/screen-header";
import { FilterChips, SecondaryButton } from "@/src/components/ui/controls";
import { EmptyState, useToast } from "@/src/components/ui/feedback";
import { useData } from "@/src/data/store";
import { buildReport } from "@/src/data/reports";
import { buildReportHtml, shareCsv, sharePdf } from "@/src/lib/export";
import { makeStyles, spacing, useTheme } from "@/src/theme";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  filters: { backgroundColor: c.surface, paddingVertical: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: c.border },
  kpis: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, flexWrap: "wrap" },
  kpi: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: spacing.md, minWidth: 100, flexGrow: 1, gap: 2 },
  kpiLabel: { fontSize: 11, color: c.muted, fontWeight: "600" },
  kpiValue: { fontSize: 17, fontWeight: "800", color: c.brandPrimary },
  tableWrap: { paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: "row", backgroundColor: c.ink, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  headerCell: { color: "#fff", fontSize: 12, fontWeight: "800", padding: spacing.sm },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: c.border, backgroundColor: c.surface },
  rowAlt: { backgroundColor: c.surfaceSecondary },
  cell: { fontSize: 12, color: c.onSurfaceSecondary, padding: spacing.sm },
  cellFirst: { fontWeight: "700", color: c.onSurface },
  count: { fontSize: 12, color: c.muted, paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  footer: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border },
  demoNote: { fontSize: 11, color: c.muted, textAlign: "center", paddingBottom: spacing.sm },
}));

export default function ReportDetail() {
  const s = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { db } = useData();
  const { type } = useLocalSearchParams<{ type: string }>();

  const [classFilter, setClassFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);

  const report = useMemo(
    () => buildReport(db, type ?? "student", classFilter, sectionFilter),
    [db, type, classFilter, sectionFilter],
  );

  const classOptions = [
    { key: "all", label: "All Classes" },
    ...db.classes.map((c) => ({ key: c.id, label: c.name })),
  ];
  const sectionOptions = [
    { key: "all", label: "All Sections" },
    { key: "A", label: "Section A" },
    { key: "B", label: "Section B" },
  ];

  const subtitle =
    (classFilter === "all" ? "All Classes" : classOptions.find((o) => o.key === classFilter)?.label) +
    (sectionFilter === "all" ? "" : ` · Section ${sectionFilter}`);

  const onExportPdf = async () => {
    setExporting("pdf");
    const html = buildReportHtml({
      title: report.title,
      subtitle,
      summary: report.summary,
      columns: report.columns,
      rows: report.rows,
    });
    const res = await sharePdf(html);
    setExporting(null);
    if (!res.ok)
      toast.show(
        res.reason === "unavailable"
          ? "Export & share opens on the mobile app"
          : "Export failed",
        res.reason === "unavailable" ? "info" : "warning",
      );
  };

  const onExportCsv = async () => {
    setExporting("csv");
    const res = await shareCsv(type ?? "report", report.columns, report.rows);
    setExporting(null);
    if (!res.ok)
      toast.show(
        res.reason === "unavailable"
          ? "Export & share opens on the mobile app"
          : "Export failed",
        res.reason === "unavailable" ? "info" : "warning",
      );
  };

  return (
    <View style={s.root}>
      <StackHeader title={report.title} subtitle={`${report.rows.length} records`} />
      {report.hasFilter ? (
        <View style={s.filters}>
          <FilterChips options={classOptions} selected={classFilter} onSelect={setClassFilter} testIDPrefix="report-class" />
          <FilterChips options={sectionOptions} selected={sectionFilter} onSelect={setSectionFilter} testIDPrefix="report-section" />
        </View>
      ) : null}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <View style={s.kpis}>
          {report.summary.map((k) => (
            <View key={k.label} style={s.kpi}>
              <Text style={s.kpiLabel}>{k.label}</Text>
              <Text style={s.kpiValue}>{k.value}</Text>
            </View>
          ))}
        </View>

        <Text style={s.count}>{report.rows.length} record(s)</Text>

        {report.rows.length === 0 ? (
          <EmptyState title="No records" message="No data matches the selected filters." />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tableWrap}>
            <View>
              <View style={s.headerRow}>
                {report.columns.map((col, i) => (
                  <Text key={col} style={[s.headerCell, { width: report.widths[i] }]}>
                    {col}
                  </Text>
                ))}
              </View>
              {report.rows.map((r, ri) => (
                <View key={ri} style={[s.row, ri % 2 === 1 && s.rowAlt]} testID={`report-row-${ri}`}>
                  {r.map((cell, ci) => (
                    <Text
                      key={ci}
                      style={[s.cell, { width: report.widths[ci] }, ci === 0 && s.cellFirst]}
                      numberOfLines={1}
                    >
                      {cell}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScrollView>

      <Text style={s.demoNote}>Demo export — files are generated locally on your device.</Text>
      <View style={[s.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <SecondaryButton
          label={exporting === "pdf" ? "Preparing…" : "Export PDF"}
          onPress={onExportPdf}
          icon={<FilePdf size={18} color={colors.onSurface} weight="bold" />}
          style={{ flex: 1 }}
          testID="export-pdf-button"
        />
        <SecondaryButton
          label={exporting === "csv" ? "Preparing…" : "Export CSV"}
          onPress={onExportCsv}
          icon={<FileCsv size={18} color={colors.onSurface} weight="bold" />}
          style={{ flex: 1 }}
          testID="export-csv-button"
        />
      </View>
    </View>
  );
}

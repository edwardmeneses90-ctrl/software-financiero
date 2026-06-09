import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

interface PDFReportProps {
  title: string;
  income: number;
  expense: number;
  transactions: { date: string; category: string; type: string; amount: number; icon: string }[];
}

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: "Helvetica" },
  header: { fontSize: 20, marginBottom: 20, textAlign: "center", fontWeight: "bold", color: "#333" },
  subHeader: { fontSize: 14, marginBottom: 10, color: "#666", fontWeight: "bold" },
  summary: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  card: { width: "30%", padding: 10, backgroundColor: "#f4f4f5", borderRadius: 5 },
  cardLabel: { fontSize: 8, color: "#555" },
  cardValue: { fontSize: 12, fontWeight: "bold", marginTop: 2 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingBottom: 5, marginBottom: 5, backgroundColor: "#f9f9f9" },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee", paddingVertical: 4 },
  colDate: { width: "20%", fontSize: 9, color: "#555" },
  colCat: { width: "35%", fontSize: 9, fontWeight: "bold" },
  colType: { width: "15%", fontSize: 9, textAlign: "right" },
  colAmt: { width: "30%", fontSize: 9, textAlign: "right", fontWeight: "bold" },
  footer: { position: "absolute", bottom: 30, left: 30, right: 30, textAlign: "center", fontSize: 8, color: "#999" }
});

export const PDFReport = ({ title, income, expense, transactions }: PDFReportProps) => (
  <Document>
    <Page size="LETTER" style={styles.page}>
      <Text style={styles.header}>Resumen Financiero - {title}</Text>
      
      <View style={styles.summary}>
        <View style={styles.card}><Text style={styles.cardLabel}>Ingresos</Text><Text style={{...styles.cardValue, color: "#10b981"}}>${income.toLocaleString('es-CO')}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Egresos</Text><Text style={{...styles.cardValue, color: "#ef4444"}}>${expense.toLocaleString('es-CO')}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Disponible</Text><Text style={styles.cardValue}>${(income - expense).toLocaleString('es-CO')}</Text></View>
      </View>

      <Text style={styles.subHeader}>Detalle de Movimientos</Text>
      <View style={styles.tableHeader}>
        <Text style={styles.colDate}>Fecha</Text>
        <Text style={styles.colCat}>Categoría</Text>
        <Text style={styles.colType}>Tipo</Text>
        <Text style={styles.colAmt}>Monto</Text>
      </View>

      {transactions.map((tx, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={styles.colDate}>{tx.date}</Text>
          <Text style={styles.colCat}>{tx.icon} {tx.category}</Text>
          <Text style={styles.colType}>{tx.type === 'income' ? 'Ingreso' : 'Egreso'}</Text>
          <Text style={{...styles.colAmt, color: tx.type === 'income' ? '#10b981' : '#ef4444'}}>${tx.amount.toLocaleString('es-CO')}</Text>
        </View>
      ))}

      <Text style={styles.footer}>Generado por Control Financiero - {new Date().toLocaleDateString()}</Text>
    </Page>
  </Document>
);
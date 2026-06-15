import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import RobotoRegular from '../assets/fonts/Roboto-Regular.ttf'
import RobotoBold from '../assets/fonts/Roboto-Bold.ttf'

Font.register({
  family: 'Roboto',
  fonts: [
    { src: RobotoRegular, fontWeight: 400 },
    { src: RobotoBold, fontWeight: 700 },
  ],
})

const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
]

const formatRON = (amount) =>
  new Intl.NumberFormat('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' RON'

const formatDate = (date) => {
  const d = new Date(date)
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
    paddingTop: 48,
    paddingBottom: 60,
    paddingHorizontal: 48,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: { fontSize: 20, fontFamily: 'Roboto', fontWeight: 700, color: '#000000' },
  metaLabel: {
    fontSize: 7,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: '#999999',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 2,
  },
  metaValue: { fontSize: 9, color: '#000000' },
  headerRight: { alignItems: 'flex-end' },
  brandName: { fontSize: 12, fontFamily: 'Roboto', fontWeight: 700, color: '#000000' },
  brandSub: { fontSize: 8, color: '#999999', marginTop: 2 },
  brandInfo: { fontSize: 8, color: '#999999', marginTop: 2 },

  divider: { borderBottomWidth: 0.5, borderColor: '#cccccc', marginVertical: 14 },

  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: '#000000',
    marginTop: 20,
    marginBottom: 10,
  },

  summaryHeaderRow: { flexDirection: 'row', paddingBottom: 5 },
  summaryHeaderCell: {
    fontSize: 7,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: '#999999',
    letterSpacing: 0.6,
    flex: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderColor: '#cccccc',
  },
  summaryCell: { fontSize: 11, color: '#000000', flex: 1 },
  summaryCellBold: { fontSize: 11, fontFamily: 'Roboto', fontWeight: 700, color: '#000000', flex: 1 },

  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderTopWidth: 1,
    borderColor: '#000000',
    paddingVertical: 5,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: '#999999',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    borderBottomWidth: 0.5,
    borderColor: '#eeeeee',
  },
  tableCell: { fontSize: 8, color: '#000000' },
  tableCellMuted: { fontSize: 8, color: '#666666' },
  tableCellBold: { fontSize: 8, fontFamily: 'Roboto', fontWeight: 700, color: '#000000' },

  totalsRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#000000',
  },
  totalsLabel: {
    fontSize: 7,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: '#999999',
    letterSpacing: 0.6,
  },
  totalsValue: {
    fontSize: 10,
    fontFamily: 'Roboto',
    fontWeight: 700,
    color: '#000000',
  },

  nsName:     { width: '26%' },
  nsSku:      { width: '14%' },
  nsCategory: { width: '20%' },
  nsQty:      { width: '14%' },
  nsPrice:    { width: '13%' },
  nsDate:     { width: '13%' },

  cDate:     { width: '10%' },
  cRef:      { width: '9%' },
  cSupplier: { width: '20%' },
  cCategory: { width: '13%' },
  cType:     { width: '8%' },
  cMethod:   { width: '13%' },
  cAmount:   { width: '14%' },
  cStatus:   { width: '13%' },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderColor: '#cccccc',
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: '#999999' },
})

const ReportPDF = ({ month, year, transactions, newStockItems = [], stats, generatedBy }) => {
  const approved = transactions.filter(t => t.status === 'Aprobat')
  const pending = transactions.filter(t => t.status === 'În așteptare')
  const rejected = transactions.filter(t => t.status === 'Respins')

  const startDay = `01.${String(month).padStart(2, '0')}.${year}`
  const endDay = `${new Date(year, month, 0).getDate()}.${String(month).padStart(2, '0')}.${year}`

  return (
    <Document title={`Raport ${MONTHS[month - 1]} ${year}`}>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Raport financiar lunar</Text>
            <View>
              <Text style={styles.metaLabel}>PERIOADA</Text>
              <Text style={styles.metaValue}>{startDay} - {endDay}</Text>
              <Text style={styles.metaLabel}>GENERAT DE</Text>
              <Text style={styles.metaValue}>{generatedBy}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.brandName}>EnterpriseFlow</Text>
            <Text style={[styles.brandInfo, { marginTop: 8 }]}>Data generării: {formatDate(new Date())}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Sumar */}
        <Text style={styles.sectionTitle}>Sumar</Text>

        <View style={styles.summaryHeaderRow}>
          <Text style={styles.summaryHeaderCell}>LUNA</Text>
          <Text style={styles.summaryHeaderCell}>ÎNCASĂRI</Text>
          <Text style={styles.summaryHeaderCell}>CHELTUIELI</Text>
          <Text style={styles.summaryHeaderCell}>PROFIT NET</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryCell}>{MONTHS[month - 1]} {year}</Text>
          <Text style={styles.summaryCellBold}>{formatRON(stats.monthlyIncome)}</Text>
          <Text style={styles.summaryCellBold}>{formatRON(stats.monthlyExpenses)}</Text>
          <Text style={styles.summaryCellBold}>{formatRON(stats.netProfit)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryCell}>Status tranzacții</Text>
          <Text style={styles.summaryCell}>{approved.length} aprobate</Text>
          <Text style={styles.summaryCell}>{pending.length} în așteptare</Text>
          <Text style={styles.summaryCell}>{rejected.length} respinse</Text>
        </View>

        <View style={styles.divider} />

        {/* Produse noi adaugate in stoc */}
        <Text style={styles.sectionTitle}>Listă evidență stoc</Text>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, styles.nsName]}>PRODUS</Text>
          <Text style={[styles.tableHeaderCell, styles.nsSku]}>SKU</Text>
          <Text style={[styles.tableHeaderCell, styles.nsCategory]}>CATEGORIE</Text>
          <Text style={[styles.tableHeaderCell, styles.nsQty]}>CANTITATE</Text>
          <Text style={[styles.tableHeaderCell, styles.nsPrice]}>PRET UNITAR</Text>
          <Text style={[styles.tableHeaderCell, styles.nsDate]}>ADAUGAT LA</Text>
        </View>

        {newStockItems.length === 0 ? (
          <Text style={[styles.tableCellMuted, { paddingVertical: 10 }]}>
            Niciun produs nou adaugat in nomenclator in aceasta perioada.
          </Text>
        ) : newStockItems.map((s) => (
          <View key={s._id} style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.nsName]} numberOfLines={1}>{s.name}</Text>
            <Text style={[styles.tableCellMuted, styles.nsSku]}>{s.sku || '-'}</Text>
            <Text style={[styles.tableCellMuted, styles.nsCategory]} numberOfLines={1}>{s.category || '-'}</Text>
            <Text style={[styles.tableCell, styles.nsQty]}>{s.quantity} {s.unit}</Text>
            <Text style={[styles.tableCellMuted, styles.nsPrice]}>{s.unitPrice ? formatRON(s.unitPrice) : '-'}</Text>
            <Text style={[styles.tableCellMuted, styles.nsDate]}>{formatDate(s.createdAt)}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Tranzactii */}
        <Text style={styles.sectionTitle}>Tranzacții</Text>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderCell, styles.cDate]}>DATA</Text>
          <Text style={[styles.tableHeaderCell, styles.cRef]}>REF.</Text>
          <Text style={[styles.tableHeaderCell, styles.cSupplier]}>FURNIZOR</Text>
          <Text style={[styles.tableHeaderCell, styles.cCategory]}>CATEGORIE</Text>
          <Text style={[styles.tableHeaderCell, styles.cType]}>TIP</Text>
          <Text style={[styles.tableHeaderCell, styles.cMethod]}>PLATA</Text>
          <Text style={[styles.tableHeaderCell, styles.cAmount]}>TOTAL</Text>
          <Text style={[styles.tableHeaderCell, styles.cStatus]}>STATUS</Text>
        </View>

        {transactions.length === 0 ? (
          <Text style={[styles.tableCellMuted, { paddingVertical: 10 }]}>
            Nicio tranzactie in aceasta perioada.
          </Text>
        ) : transactions.map((t) => (
          <View key={t._id} style={styles.tableRow}>
            <Text style={[styles.tableCellMuted, styles.cDate]}>{formatDate(t.createdAt)}</Text>
            <Text style={[styles.tableCellMuted, styles.cRef]}>{t.reference}</Text>
            <Text style={[styles.tableCell, styles.cSupplier]} numberOfLines={1}>{t.supplier}</Text>
            <Text style={[styles.tableCellMuted, styles.cCategory]}>{t.category}</Text>
            <Text style={[styles.tableCell, styles.cType]}>{t.type}</Text>
            <Text style={[styles.tableCellMuted, styles.cMethod]}>{t.paymentMethod}</Text>
            <Text style={[styles.tableCellBold, styles.cAmount]}>{formatRON(t.totalAmount)}</Text>
            <Text style={[styles.tableCell, styles.cStatus]}>{t.status}</Text>
          </View>
        ))}

        <View style={styles.totalsRow}>
          <Text style={[styles.totalsLabel, styles.cDate]} />
          <Text style={[styles.totalsLabel, styles.cRef]} />
          <Text style={[styles.totalsLabel, styles.cSupplier]}>TOTAL LUNAR</Text>
          <Text style={[styles.totalsLabel, styles.cCategory]} />
          <Text style={[styles.totalsLabel, styles.cType]} />
          <Text style={[styles.totalsLabel, styles.cMethod]} />
          <Text style={[styles.totalsValue, styles.cAmount]}>
            {formatRON(stats.monthlyIncome + stats.monthlyExpenses)}
          </Text>
          <Text style={[styles.totalsLabel, styles.cStatus]} />
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            EnterpriseFlow · Raport {MONTHS[month - 1]} {year} · Confidential
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} din ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  )
}

export default ReportPDF
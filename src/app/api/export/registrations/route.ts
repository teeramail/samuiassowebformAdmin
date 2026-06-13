import { db } from '@/server/db';
import { registrations } from '@/server/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function stringCell(value: string): string {
  return `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
}

function numberCell(value: number): string {
  return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
}

function formatDate(value: Date | string | null | undefined): string {
  if (value == null) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

function formatStatus(value: string): string {
  if (value === 'thai_tourist') {
    return 'Thai Tourist';
  }

  if (value === 'international') {
    return 'International';
  }

  return 'Local';
}

function formatEquipment(value: string): string {
  if (value === 'telescope') {
    return 'Telescope';
  }

  if (value === 'camera_stand') {
    return 'Camera Stand';
  }

  return 'None';
}

export async function GET() {
  const allData = await db
    .select()
    .from(registrations)
    .orderBy(desc(registrations.createdAt));

  const headerRow = [
    'ID',
    'Name',
    'Email',
    'Phone',
    'Status',
    'Companions',
    'Equipment',
    'Sources',
    'Source Other',
    'Google ID',
    'Attended',
    'Admin Notes',
    'Created At',
  ]
    .map((value) => `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`)
    .join('');

  const rows = allData
    .map((row) => {
      return [
        numberCell(row.id),
        stringCell(row.name),
        stringCell(row.email),
        stringCell(row.phone),
        stringCell(formatStatus(row.status)),
        numberCell(row.companions ?? 0),
        stringCell(formatEquipment(row.equipment)),
        stringCell(row.sources),
        stringCell(row.sourceOther ?? ''),
        stringCell(row.googleId ?? ''),
        stringCell(row.attended ? 'Yes' : 'No'),
        stringCell(row.adminNotes ?? ''),
        stringCell(formatDate(row.createdAt)),
      ].join('');
    })
    .map((cells) => `<Row>${cells}</Row>`)
    .join('');

  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook
  xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
>
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1" />
      <Interior ss:Color="#E0E7FF" ss:Pattern="Solid" />
    </Style>
  </Styles>
  <Worksheet ss:Name="Registrations">
    <Table>
      <Row>${headerRow}</Row>
      ${rows}
    </Table>
  </Worksheet>
</Workbook>`;

  const fileDate = new Date().toISOString().slice(0, 10);

  return new Response(workbook, {
    headers: {
      'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
      'Content-Disposition': `attachment; filename="registrations-${fileDate}.xls"`,
      'Cache-Control': 'no-store',
    },
  });
}

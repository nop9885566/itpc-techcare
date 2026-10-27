import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { CaseWithDetails, Student } from '@/lib/types'
import { formatThaiDate, formatThaiDateTime } from '@/lib/dateUtils'
import { getCaseTypeLabel, getStatusLabel } from '@/lib/types'

function escapeHtml(value: string | null | undefined): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function signatureImage(value: string): string {
  return /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ? value : ''
}

function safeFilename(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_')
}

/**
 * Render an HTML element offscreen and convert it to an A4 PDF
 * This guarantees 100% perfect Thai typography (vowels and tone marks aligned)
 */
async function generatePDFFromHTML(htmlContent: string, filename: string): Promise<void> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-99999px'
  container.style.left = '-99999px'
  container.style.width = '794px' // A4 width at 96 DPI
  container.style.backgroundColor = '#ffffff'
  container.style.color = '#1f2937'
  container.style.fontFamily = "'Sarabun', 'Noto Sans Thai', sans-serif"
  container.style.boxSizing = 'border-box'
  container.innerHTML = htmlContent

  document.body.appendChild(container)

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // 2x scale for crisp printing
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    // Add first page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight

    // Add subsequent pages if multi-page document
    while (heightLeft > 0) {
      position = position - pdfHeight
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
    }

    pdf.save(filename)
  } finally {
    document.body.removeChild(container)
  }
}

/**
 * Export a single case report to PDF with perfect Thai typography
 */
export async function exportCasePDF(caseData: CaseWithDetails): Promise<void> {
  const rawCaseLabel = getCaseTypeLabel(caseData.case_type, caseData.other_text)
  const caseLabel = escapeHtml(rawCaseLabel)
  const statusThai = getStatusLabel(caseData.status)

  const html = `
    <div style="padding: 40px; font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; line-height: 1.6; color: #1e293b;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #315e52; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="font-size: 24px; font-weight: 700; color: #315e52; margin: 0;">itpctakecare</h1>
          <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">ระบบบันทึกและติดตามการดูแลนักเรียนรายเคส</p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 13px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; background-color: ${caseData.status === 'done' ? '#dcfce7' : '#fef3c7'}; color: ${caseData.status === 'done' ? '#166534' : '#92400e'}; border: 1px solid ${caseData.status === 'done' ? '#86efac' : '#fde68a'};">
            ${statusThai}
          </span>
          <p style="font-size: 11px; color: #94a3b8; margin: 6px 0 0 0;">วันที่พิมพ์: ${formatThaiDate(new Date().toISOString())}</p>
        </div>
      </div>

      <!-- Case Title -->
      <div style="background-color: #eff6f2; border: 1px solid #dcebe3; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #23483f; margin: 0 0 8px 0;">
          รายงานเคส: ${caseLabel}
        </h2>
        <div style="display: flex; gap: 24px; font-size: 13px; color: #4b5563;">
          <span><strong>วัน-เวลานัดหมาย:</strong> ${formatThaiDateTime(caseData.scheduled_at)}</span>
          <span><strong>ผู้สร้างเคส:</strong> ${escapeHtml(caseData.creator?.name || 'ไม่ระบุ')}</span>
          <span><strong>สร้างเมื่อ:</strong> ${formatThaiDateTime(caseData.created_at)}</span>
        </div>
        ${caseData.details ? `
          <div style="margin-top: 12px; font-size: 13px; color: #374151; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e9d5ff;">
            <strong>รายละเอียดเคส:</strong><br/>
            ${escapeHtml(caseData.details).replace(/\n/g, '<br/>')}
          </div>
        ` : ''}
      </div>

      <!-- Students -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #315e52; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px 0;">
          นักเรียนที่เกี่ยวข้อง (${caseData.students.length} คน)
        </h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background-color: #f8fafc; text-align: left; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px;">ลำดับ</th>
              <th style="padding: 8px;">รหัสนักเรียน</th>
              <th style="padding: 8px;">ชื่อ-นามสกุล</th>
              <th style="padding: 8px;">ชื่อเล่น</th>
              <th style="padding: 8px;">ชั้น/ห้อง</th>
            </tr>
          </thead>
          <tbody>
            ${caseData.students.map((s, idx) => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px;">${idx + 1}</td>
                <td style="padding: 8px;">${escapeHtml(s.student_id || '-')}</td>
                <td style="padding: 8px; font-weight: 600;">${escapeHtml(`${s.first_name_th ?? ''} ${s.last_name_th ?? ''}`)}</td>
                <td style="padding: 8px;">${escapeHtml(s.nickname_th || '-')}</td>
                <td style="padding: 8px;">${escapeHtml(s.grade || '-')}/${s.room ?? '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Caretakers -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #315e52; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px 0;">
          ผู้ดูแลที่รับผิดชอบ
        </h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${caseData.caretakers.map(ct => `
            <span style="font-size: 12px; padding: 4px 10px; background: #f1f5f9; border-radius: 4px; border: 1px solid #e2e8f0;">
              ${escapeHtml(ct.name)}
            </span>
          `).join('')}
        </div>
      </div>

      <!-- Updates -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #315e52; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 10px 0;">
          ประวัติการอัปเดตความคืบหน้า (${caseData.updates.length} ครั้ง)
        </h3>
        ${caseData.updates.length === 0 ? `
          <p style="font-size: 13px; color: #94a3b8; font-style: italic;">ยังไม่มีบันทึกการอัปเดต</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${caseData.updates.map((u, idx) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #64748b;">
                  <strong style="color: #315e52;">ครั้งที่ ${idx + 1} — ${escapeHtml(u.caretaker?.name || 'ผู้ดูแล')}</strong>
                  <span>${formatThaiDateTime(u.created_at)}</span>
                </div>
                ${u.activity_note ? `<p style="font-size: 13px; margin: 2px 0;"><strong>สิ่งที่ทำ:</strong> ${escapeHtml(u.activity_note)}</p>` : ''}
                ${u.result_note ? `<p style="font-size: 13px; margin: 2px 0;"><strong>ผลที่ได้:</strong> ${escapeHtml(u.result_note)}</p>` : ''}
                ${u.next_step ? `<p style="font-size: 13px; margin: 2px 0; color: #0369a1;"><strong>ขั้นตอนต่อไป:</strong> ${escapeHtml(u.next_step)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Signatures -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #315e52; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 12px 0;">
          ลายเซ็นรับทราบ (${caseData.signatures.length})
        </h3>
        ${caseData.signatures.length === 0 ? `
          <p style="font-size: 13px; color: #94a3b8; font-style: italic;">ยังไม่มีลายเซ็น</p>
        ` : `
          <div style="display: flex; flex-wrap: wrap; gap: 16px;">
            ${caseData.signatures.map(sig => `
              <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; text-align: center; width: 170px; background: #ffffff;">
                <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 6px;">
                  ${signatureImage(sig.signature_data) ? `<img src="${signatureImage(sig.signature_data)}" style="max-height: 55px; max-width: 150px; object-fit: contain;" />` : ''}
                </div>
                <div style="font-size: 12px; font-weight: 600;">${escapeHtml(sig.signer_name)}</div>
                <div style="font-size: 11px; color: #64748b;">(${escapeHtml(sig.signer_role)})</div>
                <div style="font-size: 10px; color: #94a3b8;">${formatThaiDate(sig.signed_at)}</div>
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Footer Note -->
      <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 24px; font-size: 11px; color: #94a3b8; text-align: center;">
        เอกสารนี้ออกโดยระบบ itpctakecare — โรงเรียน ITPC เพื่อใช้เป็นหลักฐานการดูแลนักเรียนภายในสถานศึกษา
      </div>
    </div>
  `

  await generatePDFFromHTML(html, `เคส_${safeFilename(rawCaseLabel.slice(0, 15))}_${formatThaiDate(caseData.created_at)}.pdf`)
}

/**
 * Export student summary report to PDF with perfect Thai typography
 */
export async function exportStudentReportPDF(
  student: Student,
  cases: CaseWithDetails[]
): Promise<void> {
  const rawFullName = `${student.first_name_th ?? ''} ${student.last_name_th ?? ''}`.trim()
  const fullName = escapeHtml(rawFullName)
  const orderedCases = [...cases].sort((a, b) =>
    new Date(b.scheduled_at ?? b.created_at).getTime() - new Date(a.scheduled_at ?? a.created_at).getTime()
  )

  const html = `
    <div style="padding: 40px; font-family: 'Sarabun', 'Noto Sans Thai', sans-serif; line-height: 1.6; color: #1e293b;">
      <!-- Header -->
      <div style="border-bottom: 3px solid #315e52; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="font-size: 24px; font-weight: 700; color: #315e52; margin: 0;">itpctakecare</h1>
          <p style="font-size: 14px; color: #64748b; margin: 4px 0 0 0;">รายงานสรุปประวัติการดูแลนักเรียนรายบุคคล</p>
        </div>
        <div style="text-align: right;">
          <p style="font-size: 11px; color: #94a3b8; margin: 0;">วันที่พิมพ์: ${formatThaiDate(new Date().toISOString())}</p>
        </div>
      </div>

      <!-- Student Profile Card -->
      <div style="background-color: #eff6f2; border: 1px solid #dcebe3; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
        <h2 style="font-size: 18px; font-weight: 700; color: #23483f; margin: 0 0 10px 0;">
          ข้อมูลนักเรียน: ${fullName} ${student.nickname_th ? `(${student.nickname_th})` : ''}
        </h2>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 13px; color: #374151;">
          <div><strong>รหัสนักเรียน:</strong> ${escapeHtml(student.student_id || '-')}</div>
          <div><strong>ระดับชั้น:</strong> ${escapeHtml(student.grade || '-')}/${student.room ?? '-'}</div>
          <div><strong>เพศ:</strong> ${escapeHtml(student.gender || '-')}</div>
          <div><strong>ปีการศึกษา:</strong> ${student.academic_year}</div>
          <div><strong>จำนวนเคสทั้งหมด:</strong> ${orderedCases.length} เคส</div>
        </div>
      </div>

      <!-- Cases List -->
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 15px; font-weight: 700; color: #315e52; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin: 0 0 14px 0;">
          รายการเคสการดูแลทั้งหมด (${orderedCases.length} เคส)
        </h3>

        ${orderedCases.length === 0 ? `
          <p style="font-size: 13px; color: #94a3b8; font-style: italic;">ไม่มีประวัติเคสสำหรับนักเรียนคนนี้</p>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${orderedCases.map((c, idx) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <strong style="font-size: 14px; color: #23483f;">
                    ${idx + 1}. ${escapeHtml(getCaseTypeLabel(c.case_type, c.other_text))}
                  </strong>
                  <span style="font-size: 11px; padding: 2px 8px; border-radius: 9999px; background-color: ${c.status === 'done' ? '#dcfce7' : '#fef3c7'}; color: ${c.status === 'done' ? '#166534' : '#92400e'};">
                    ${getStatusLabel(c.status)}
                  </span>
                </div>

                <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
                  <span>นัดหมาย: ${formatThaiDateTime(c.scheduled_at)}</span> ·
                  <span>ผู้ดูแล: ${c.caretakers.map(ct => escapeHtml(ct.name)).join(', ') || '-'}</span> ·
                  <span>อัปเดต: ${c.updates.length} ครั้ง</span> ·
                  <span>ลายเซ็น: ${c.signatures.length} ลายเซ็น</span>
                </div>

                ${c.details ? `
                  <p style="font-size: 12px; color: #374151; margin: 4px 0 0 0; background: #f8fafc; padding: 8px; border-radius: 4px;">
                    ${escapeHtml(c.details)}
                  </p>
                ` : ''}
                ${c.updates.length > 0 ? `
                  <div style="margin-top: 10px;">
                    <strong style="font-size: 12px; color: #315e52;">บันทึกการติดตาม</strong>
                    ${c.updates.map((update, updateIndex) => `
                      <div style="margin-top: 6px; padding: 8px; border-left: 3px solid #8ab3a4; background: #f5f8f6;">
                        <div style="font-size: 11px; color: #64748b;">ครั้งที่ ${updateIndex + 1} · ${escapeHtml(update.caretaker?.name || 'ผู้ดูแล')} · ${formatThaiDateTime(update.created_at)}</div>
                        ${update.activity_note ? `<p style="font-size: 12px; margin: 3px 0;"><strong>กิจกรรม:</strong> ${escapeHtml(update.activity_note)}</p>` : ''}
                        ${update.result_note ? `<p style="font-size: 12px; margin: 3px 0;"><strong>ผล:</strong> ${escapeHtml(update.result_note)}</p>` : ''}
                        ${update.next_step ? `<p style="font-size: 12px; margin: 3px 0;"><strong>ขั้นตอนถัดไป:</strong> ${escapeHtml(update.next_step)}</p>` : ''}
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
                ${c.signatures.length > 0 ? `
                  <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                    ${c.signatures.map(signature => `
                      <div style="width: 150px; padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; text-align: center;">
                        ${signatureImage(signature.signature_data) ? `<img src="${signatureImage(signature.signature_data)}" style="height: 45px; max-width: 130px; object-fit: contain;" />` : ''}
                        <div style="font-size: 11px; font-weight: 600;">${escapeHtml(signature.signer_name)}</div>
                        <div style="font-size: 10px; color: #64748b;">${escapeHtml(signature.signer_role)} · ${formatThaiDateTime(signature.signed_at)}</div>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>

      <!-- Footer Note -->
      <div style="border-top: 1px dashed #cbd5e1; padding-top: 12px; margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center;">
        รายงานสรุปประวัตินักเรียน — ออกโดยระบบ itpctakecare
      </div>
    </div>
  `

  await generatePDFFromHTML(html, `รายงานนักเรียน_${safeFilename(rawFullName)}_${formatThaiDate(new Date().toISOString())}.pdf`)
}

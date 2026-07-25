import express from 'express';
import PDFDocument from 'pdfkit';
import { Will } from '../models/Will.js';
import { Beneficiary } from '../models/Beneficiary.js';
import { Asset } from '../models/Asset.js';
import { Document as DocModel } from '../models/Document.js';
import { isMongoConnected, memoryStore } from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const router = express.Router();

/**
 * GET /api/pdf/will/:willId — Generate & Download Will as PDF
 */
router.get('/will/:willId', requireAuth, async (req, res) => {
  try {
    const { willId } = req.params;
    const userEmail = req.user?.email || 'owner';

    let will, beneficiaries, assets, documents;

    if (isMongoConnected) {
      will = await Will.findById(willId);
      beneficiaries = await Beneficiary.find().sort({ createdAt: -1 });
      assets = await Asset.find().sort({ createdAt: -1 });
      documents = await DocModel.find().sort({ uploadDate: -1 });
    } else {
      will = memoryStore.wills.find(w => w._id === willId);
      beneficiaries = memoryStore.beneficiaries || [];
      assets = memoryStore.assets || [];
      documents = memoryStore.documents || [];
    }

    if (!will) {
      return res.status(404).json({ success: false, message: 'Will not found.' });
    }

    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Digital_Will_${will.willTitle.replace(/\s+/g, '_')}.pdf"`);

    doc.pipe(res);

    // ── Header ──
    doc.rect(0, 0, 595.28, 100).fill('#2B103D');
    doc.fontSize(24).fillColor('#D2C8BC').font('Helvetica-Bold')
      .text('DIGITAL WILL AI', 50, 30);
    doc.fontSize(10).fillColor('#9A2CF2')
      .text('Secure Digital Will Certificate', 50, 60);
    doc.fontSize(8).fillColor('#8D89AF')
      .text(`Generated: ${new Date().toLocaleString()}`, 50, 78);

    doc.moveDown(3);

    // ── Will Title ──
    doc.fillColor('#2B103D').fontSize(18).font('Helvetica-Bold')
      .text(will.willTitle, 50, 120);
    doc.moveTo(50, 145).lineTo(545, 145).strokeColor('#9A2CF2').lineWidth(2).stroke();
    doc.moveDown(1.5);

    // ── Owner Information ──
    let y = 165;
    doc.fontSize(13).fillColor('#731BB8').font('Helvetica-Bold').text('Owner Information', 50, y);
    y += 25;
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    doc.text(`Full Name:    ${will.fullName}`, 70, y); y += 18;
    doc.text(`Date of Birth:  ${will.dob}`, 70, y); y += 18;
    doc.text(`Address:      ${will.address}`, 70, y); y += 18;
    y += 10;

    // ── Executor ──
    doc.fontSize(13).fillColor('#731BB8').font('Helvetica-Bold').text('Executor', 50, y);
    y += 25;
    doc.fontSize(10).fillColor('#333').font('Helvetica');
    doc.text(`Name:  ${will.executorName}`, 70, y);
    y += 30;

    // ── Beneficiaries Table ──
    doc.fontSize(13).fillColor('#731BB8').font('Helvetica-Bold').text('Beneficiaries', 50, y);
    y += 25;

    if (beneficiaries.length > 0) {
      // Table header
      doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.rect(50, y, 495, 18).fill('#731BB8');
      doc.text('Name', 55, y + 5, { width: 130 });
      doc.text('Email', 190, y + 5, { width: 160 });
      doc.text('Relationship', 355, y + 5, { width: 100 });
      doc.text('Status', 460, y + 5, { width: 80 });
      y += 18;

      doc.font('Helvetica').fontSize(8).fillColor('#333');
      beneficiaries.forEach((b, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        const bgColor = i % 2 === 0 ? '#F5F0FF' : '#FFFFFF';
        doc.rect(50, y, 495, 18).fill(bgColor);
        doc.fillColor('#333');
        doc.text(b.name || '—', 55, y + 5, { width: 130 });
        doc.text(b.email || '—', 190, y + 5, { width: 160 });
        doc.text(b.relationship || '—', 355, y + 5, { width: 100 });
        doc.text(b.status || 'Pending', 460, y + 5, { width: 80 });
        y += 18;
      });
    } else {
      doc.fontSize(9).fillColor('#888').font('Helvetica').text('No beneficiaries added.', 70, y);
      y += 20;
    }
    y += 15;

    // ── Assets Table ──
    if (y > 650) { doc.addPage(); y = 50; }
    doc.fontSize(13).fillColor('#731BB8').font('Helvetica-Bold').text('Assets', 50, y);
    y += 25;

    if (assets.length > 0) {
      doc.fontSize(8).fillColor('#FFFFFF').font('Helvetica-Bold');
      doc.rect(50, y, 495, 18).fill('#731BB8');
      doc.text('Asset Name', 55, y + 5, { width: 140 });
      doc.text('Type', 200, y + 5, { width: 110 });
      doc.text('Value', 315, y + 5, { width: 100 });
      doc.text('Beneficiary', 420, y + 5, { width: 120 });
      y += 18;

      doc.font('Helvetica').fontSize(8).fillColor('#333');
      assets.forEach((a, i) => {
        if (y > 720) { doc.addPage(); y = 50; }
        const bgColor = i % 2 === 0 ? '#F5F0FF' : '#FFFFFF';
        doc.rect(50, y, 495, 18).fill(bgColor);
        doc.fillColor('#333');
        doc.text(a.assetName || '—', 55, y + 5, { width: 140 });
        doc.text(a.assetType || '—', 200, y + 5, { width: 110 });
        doc.text(a.estimatedValue || '—', 315, y + 5, { width: 100 });
        doc.text(a.assignedBeneficiary || '—', 420, y + 5, { width: 120 });
        y += 18;
      });
    } else {
      doc.fontSize(9).fillColor('#888').font('Helvetica').text('No assets registered.', 70, y);
      y += 20;
    }
    y += 15;

    // ── Uploaded Documents ──
    if (y > 650) { doc.addPage(); y = 50; }
    doc.fontSize(13).fillColor('#731BB8').font('Helvetica-Bold').text('Uploaded Documents', 50, y);
    y += 25;

    if (documents.length > 0) {
      doc.fontSize(9).fillColor('#333').font('Helvetica');
      documents.forEach((d) => {
        if (y > 720) { doc.addPage(); y = 50; }
        doc.text(`• ${d.documentType}: ${d.originalName}`, 70, y);
        y += 16;
      });
    } else {
      doc.fontSize(9).fillColor('#888').font('Helvetica').text('No documents uploaded.', 70, y);
      y += 20;
    }
    y += 15;

    // ── Special Instructions ──
    if (will.specialInstructions) {
      if (y > 600) { doc.addPage(); y = 50; }
      doc.fontSize(13).fillColor('#731BB8').font('Helvetica-Bold').text('Special Instructions', 50, y);
      y += 25;
      doc.fontSize(9).fillColor('#333').font('Helvetica')
        .text(will.specialInstructions, 70, y, { width: 470 });
      y += doc.heightOfString(will.specialInstructions, { width: 470 }) + 20;
    }

    // ── Digital Signature Area ──
    if (y > 620) { doc.addPage(); y = 50; }
    y += 20;
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#D2C8BC').lineWidth(0.5).stroke();
    y += 20;
    doc.fontSize(11).fillColor('#731BB8').font('Helvetica-Bold').text('Digital Signature', 50, y);
    y += 30;
    doc.fontSize(9).fillColor('#333').font('Helvetica');
    doc.text('Signature: ___________________________________', 70, y); y += 25;
    doc.text(`Name: ${will.fullName}`, 70, y); y += 18;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 70, y); y += 18;
    doc.text('Witness: ___________________________________', 70, y);

    // ── Footer on every page ──
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(7).fillColor('#8D89AF').font('Helvetica')
        .text(
          `Digital Will AI — Confidential Document — Page ${i + 1} of ${pageCount}`,
          50, 780,
          { width: 495, align: 'center' }
        );
    }

    doc.end();

    await logAuditEvent({
      action: 'PDF Downloaded',
      req, userEmail,
      status: 'SUCCESS',
      description: `Downloaded Will PDF: ${will.willTitle}`
    });

  } catch (error) {
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Unable to generate PDF.' });
    }
  }
});

export default router;

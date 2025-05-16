const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const fs = require('fs');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/generate-invoice-pdf', async (req, res) => {
  const { html, fileName = 'invoice.pdf' } = req.body;
  if (!html) return res.status(400).send('Missing HTML content');

  try {
    // Read and inline the CSS
    const css = fs.readFileSync(__dirname + '/../public/output.css', 'utf8');
    // Replace the <link rel="stylesheet" ...> with <style>...</style>
    const htmlWithInlineCss = html.replace(
      /<link rel="stylesheet" [^>]*output\.css[^>]*>/,
      `<style>${css}</style>`
    );

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlWithInlineCss, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');

    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=${fileName}`,
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send('Failed to generate PDF');
  }
});

app.listen(PORT, () => {
  console.log(`PDF server running at http://localhost:${PORT}`);
}); 
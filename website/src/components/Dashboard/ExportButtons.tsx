'use client';

import { Calendar, Download, Mail, Share2 } from 'lucide-react';
import { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { emailWeeklySummary } from '@/lib/hooks/useWeeklySummary';
import { toast } from 'sonner';

interface ExportButtonsProps {
    weekStart: string;
    weekEnd: string;
}

export function ExportButtons({ weekStart, weekEnd }: ExportButtonsProps) {
    const [isExporting, setIsExporting] = useState(false);
    const [isEmailing, setIsEmailing] = useState(false);

    const handleExportPDF = async () => {
        setIsExporting(true);

        try {
            const element = document.getElementById('digest-content');
            if (!element) throw new Error('Content not found');

            // Capture as canvas
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            // Create PDF
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add additional pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Download
            const filename = `weekly-digest-${weekStart}.pdf`;
            pdf.save(filename);

            toast.success('PDF exported successfully!');
        } catch (error) {
            console.error('PDF export failed:', error);
            toast.error('Failed to export PDF');
        } finally {
            setIsExporting(false);
        }
    };

    const handleEmailDigest = async () => {
        setIsEmailing(true);

        try {
            await emailWeeklySummary(weekStart);
            toast.success('Digest emailed successfully!');
        } catch (error) {
            console.error('Email failed:', error);
            toast.error('Failed to send email');
        } finally {
            setIsEmailing(false);
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/dashboard/weekly-digest?date=${weekStart}`;

        try {
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
        } catch (error) {
            toast.error('Failed to copy link');
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download className="w-4 h-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
            </button>

            <button
                onClick={handleEmailDigest}
                disabled={isEmailing}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Mail className="w-4 h-4" />
                {isEmailing ? 'Sending...' : 'Email Me'}
            </button>

            <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Share2 className="w-4 h-4" />
                Share
            </button>
        </div>
    );
}

'use client';

import React from 'react';
import { InvoiceComponentKey, InvoiceTemplate, ResolvedLocale } from '@/types/invoice-template';

interface InvoicePrintViewProps {
    template: InvoiceTemplate;
    locale: ResolvedLocale;
    invoice: any;
}

export function InvoicePrintView({ template, locale, invoice }: InvoicePrintViewProps) {
    const components = template.components || [];
    const labels = locale.labels;

    const isEnabled = (key: InvoiceComponentKey) => {
        const comp = components.find((c) => c.key === key);
        return comp ? comp.enabled : false;
    };

    const formatCurrency = (amount: number, currency: string) => {
        const numAmount = Number(amount);
        if (isNaN(numAmount)) return '';

        if (currency === 'JPY') {
            return `¥${numAmount.toLocaleString('de-DE')}`;
        } else if (currency === 'IDR') {
            return `IDR ${numAmount.toLocaleString('de-DE')}`;
        } else {
            return `$${numAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
        }
    };

    const EMPTY_ROWS = 8;
    const filledCount = invoice.items?.length ?? 0;
    const emptyRowCount = Math.max(0, EMPTY_ROWS - filledCount);

    return (
        <div className="bg-white text-[11px] text-gray-800 px-10 py-6 font-sans leading-relaxed" style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif", WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' } as React.CSSProperties}>
            {/* ─── HEADER ─── */}
            {isEnabled('company_header') && (
                <div className="mb-6">
                    <div className="flex items-end justify-between">
                        {/* Logo */}
                        <div>
                            <img
                                src="/timedoor-logo.svg"
                                alt="Timedoor"
                                className="h-10 object-contain"
                                onError={(e) => {
                                    // Fallback to text if image not found
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement!.innerHTML =
                                        '<span style="font-size:28px;font-weight:800;color:#1B2A3D;font-family:sans-serif">timedoor</span>';
                                }}
                            />
                            <div className="text-[#10AF13] text-xs font-bold tracking-[0.3em] mt-0.5">{labels.invoice}</div>
                        </div>

                        {/* Date + Invoice Number bar */}
                        {isEnabled('invoice_meta') && (
                            <div className="flex items-stretch text-[10px]">
                                <div className="bg-[#10AF13] text-white px-3 py-1.5 font-bold flex items-center">
                                    {invoice.invoice_date}
                                </div>
                                <div className="bg-[#10AF13] text-white px-3 py-1.5 font-bold flex items-center border-l border-white/30">
                                    {labels.invoice_number}:{invoice.invoice_number}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Yellow line under header */}
                    <div className="h-[3px] w-full bg-[#10AF13] mt-1"></div>
                </div>
            )}

            {/* ─── TO + SENDER ─── */}
            <div className="flex justify-between mb-6">
                {isEnabled('customer_details') && (
                    <div>
                        <div className="text-gray-600 text-[10px]">{labels.to}</div>
                        <div className="font-bold text-base text-gray-800">
                            {invoice.customer_name || invoice.customer?.company_name || invoice.customer?.name}
                        </div>
                        {locale.language === 'ja' && <div className="text-xs mt-0.5">{labels.to}</div>}
                    </div>
                )}

                {isEnabled('sender_details') && invoice.sender && (
                    <div className="text-right text-[10px] text-gray-600 leading-snug">
                        <div className="font-bold text-xs text-gray-800 mb-0.5">{invoice.sender.company_name}</div>
                        <div>{labels.address} : {invoice.sender.address}</div>
                        <div>{labels.phone} : {invoice.sender.phone}</div>
                        <div>{labels.email} : {invoice.sender.email}</div>
                        {invoice.sender.npwp && (
                            <div>{labels.npwp} : {invoice.sender.npwp}</div>
                        )}
                    </div>
                )}
            </div>

            {/* ─── TOTAL SUMMARY BOX ─── */}
            {isEnabled('total_summary_box') && (
                <div className="mb-6 border border-gray-300 rounded-sm overflow-hidden">
                    <div className="flex">
                        <div className="bg-[#FFF9C4] px-3 py-2 border-r border-gray-300 w-32">
                            <div className="text-[10px] text-gray-600 italic leading-tight">
                                {labels.amount_of_payment}
                            </div>
                        </div>
                        <div className="flex-1 px-4 py-2 flex items-center">
                            <span className="text-2xl font-bold">{formatCurrency(invoice.total, invoice.currency)}</span>
                        </div>
                    </div>
                    {isEnabled('unique_number') && (
                        <div className="bg-[#FFF176] px-3 py-1 text-[9px] text-red-600 font-bold">
                            {labels.important_unique_code}
                        </div>
                    )}
                </div>
            )}

            {/* ─── LINE ITEMS ─── */}
            {isEnabled('line_items') && (
                <div className="mb-6">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="text-left py-1.5 px-2 text-[10px] font-bold border-b-2 border-gray-400">
                                    {labels.description}
                                </th>
                                <th className="text-center py-1.5 px-2 text-[10px] font-bold border-b-2 border-gray-400 w-16">{labels.qty}</th>
                                <th className="text-right py-1.5 px-2 text-[10px] font-bold border-b-2 border-gray-400 w-32">{labels.unit_price}</th>
                                <th className="text-right py-1.5 px-2 text-[10px] font-bold border-b-2 border-gray-400 w-32">{labels.price}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.items?.map((item: any, index: number) => (
                                <tr key={index}>
                                    <td className="py-2 px-2 text-red-500 border-b border-gray-200">{item.description}</td>
                                    <td className="py-2 px-2 text-center text-red-500 border-b border-gray-200">{item.quantity ?? 1}</td>
                                    <td className="py-2 px-2 text-right text-red-500 border-b border-gray-200">
                                        {formatCurrency(item.unit_price ?? item.amount, invoice.currency)}
                                    </td>
                                    <td className="py-2 px-2 text-right text-red-500 border-b border-gray-200">
                                        {formatCurrency(item.amount, invoice.currency)}
                                    </td>
                                </tr>
                            ))}
                            {/* Empty striped rows */}
                            {Array.from({ length: emptyRowCount }).map((_, i) => (
                                <tr key={`empty-${i}`}>
                                    <td className="py-2.5 px-2 border-b border-gray-200 bg-gray-50">&nbsp;</td>
                                    <td className="py-2.5 px-2 border-b border-gray-200 bg-gray-50"></td>
                                    <td className="py-2.5 px-2 border-b border-gray-200 bg-gray-50"></td>
                                    <td className="py-2.5 px-2 border-b border-gray-200 bg-gray-50"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ─── BANK TRANSFER + GRAND TOTAL ─── */}
            {(isEnabled('bank_transfer') || isEnabled('grand_total') || isEnabled('transfer_fee_note')) && (
                <div className="border-t-2 border-gray-300 pt-4">
                    {/* Unique code label */}
                    {isEnabled('unique_number') && isEnabled('bank_transfer') && (
                        <div className="mb-3">
                            <div className="text-[#10AF13] text-[10px] font-medium italic mb-2">
                                {labels.unique_code_label}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-start">
                        {/* Left: Payment instructions */}
                        {isEnabled('bank_transfer') && invoice.bank_info && (
                            <div className="flex-1 text-[10px] leading-relaxed">
                                <div className="mb-2 text-gray-700">{labels.payment_instruction}</div>

                                <div className="mb-1"><span className="text-gray-700">{labels.bank_name} : {invoice.bank_info.bank_name}</span></div>
                                <div className="mb-1"><span className="text-gray-700">{labels.account_name} : {invoice.bank_info.account_name}</span></div>
                                <div className="mb-3"><span className="text-gray-700">{labels.account_number} : {invoice.bank_info.account_number}</span></div>

                                {isEnabled('transfer_fee_note') && (
                                    <div className="mb-2 text-gray-700">{labels.transfer_fee}</div>
                                )}
                                {isEnabled('invoice_digits_note') && (
                                    <div className="mb-2 text-gray-700">{labels.unique_code_note}</div>
                                )}
                                {isEnabled('unique_number') && (
                                    <div className="text-red-500 text-[9px] leading-tight">{labels.unique_number_note}</div>
                                )}
                            </div>
                        )}

                        {/* Right: Grand Total box */}
                        {isEnabled('grand_total') && (
                            <div className="ml-6 text-right">
                                <div className="mb-1 text-[10px]">
                                    <span className="text-gray-600">{labels.total_sum}</span>
                                </div>
                                <div className="bg-[#FFF9C4] border border-gray-300 px-4 py-2 font-bold text-lg text-right">
                                    {formatCurrency(invoice.total, invoice.currency)}
                                </div>
                                {isEnabled('unique_number') && (
                                    <div className="mt-1 text-[8px] text-yellow-600 italic">
                                        {labels.important_unique_code}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

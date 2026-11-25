
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Plus,
    Search,
    RefreshCw,
    Receipt,
    IndianRupee,
    Wallet,
    Clock,
    Eye,
    Pencil,
    Trash2,
    X,
    CreditCard,
    CalendarDays,
    UserRound,
    FileText,
    PlusCircle,
    MinusCircle,
    CheckCircle,
    ArrowLeft,
} from 'lucide-react'

import API from '../services/api'
import { toast } from 'react-toastify'

const initialForm = {
    patient: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    tax: 0,
    discount: 0,
    paidAmount: 0,
    paymentMethod: 'Cash',
    billDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    notes: '',
}

const currency = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`

const getPatientName = (bill) =>
    bill.patient?.user?.name || 'Unknown Patient'

const Billing = () => {
    const navigate = useNavigate()
    const [bills, setBills] = useState([])
    const [patients, setPatients] = useState([])
    const [loading, setLoading] = useState(true)

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')

    const [showForm, setShowForm] = useState(false)
    const [showView, setShowView] = useState(false)
    const [showPayment, setShowPayment] = useState(false)

    const [selectedBill, setSelectedBill] = useState(null)
    const [editingId, setEditingId] = useState(null)

    const [form, setForm] = useState(initialForm)
    const [payment, setPayment] = useState({
        amount: '',
        paymentMethod: 'Cash',
    })

    const fetchData = async () => {
        try {
            setLoading(true)

            const [billResponse, patientResponse] = await Promise.all([
                API.get('/bills'),
                API.get('/patients'),
            ])

            setBills(billResponse.data.bills || [])
            setPatients(patientResponse.data.patients || [])
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to load billing data'
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const subtotal = useMemo(
        () =>
            form.items.reduce(
                (sum, item) =>
                    sum +
                    Math.max(0, Number(item.quantity) || 0) *
                    Math.max(0, Number(item.unitPrice) || 0),
                0
            ),
        [form.items]
    )

    const totalAmount = Math.max(
        0,
        subtotal + Number(form.tax || 0) - Number(form.discount || 0)
    )

    const filteredBills = bills.filter((bill) => {
        const searchText = search.toLowerCase()

        const matchesSearch =
            getPatientName(bill).toLowerCase().includes(searchText) ||
            bill.invoiceNumber?.toLowerCase().includes(searchText)

        const matchesStatus =
            statusFilter === 'All' ||
            bill.paymentStatus === statusFilter

        return matchesSearch && matchesStatus
    })

    const stats = useMemo(() => {
        const activeBills = bills.filter(
            (bill) => bill.paymentStatus !== 'Cancelled'
        )

        return {
            totalBills: bills.length,

            revenue: activeBills.reduce(
                (sum, bill) => sum + Number(bill.paidAmount || 0),
                0
            ),

            pending: activeBills.reduce(
                (sum, bill) => sum + Number(bill.dueAmount || 0),
                0
            ),

            paid: activeBills.filter(
                (bill) => bill.paymentStatus === 'Paid'
            ).length,
        }
    }, [bills])

    const updateForm = (e) => {
        const { name, value } = e.target

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    const updateItem = (index, field, value) => {
        setForm((prev) => ({
            ...prev,
            items: prev.items.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }))
    }

    const addItem = () => {
        setForm((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { description: '', quantity: 1, unitPrice: 0 },
            ],
        }))
    }

    const removeItem = (index) => {
        if (form.items.length === 1) {
            toast.error('At least one billing item is required')
            return
        }

        setForm((prev) => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }))
    }

    const openCreateForm = () => {
        setEditingId(null)
        setForm({
            ...initialForm,
            billDate: new Date().toISOString().slice(0, 10),
        })
        setShowForm(true)
    }

    const openEditForm = (bill) => {
        setEditingId(bill._id)

        setForm({
            patient: bill.patient?._id || '',
            items: bill.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })),
            tax: bill.tax || 0,
            discount: bill.discount || 0,
            paidAmount: bill.paidAmount || 0,
            paymentMethod: bill.paymentMethod || 'Cash',
            billDate: bill.billDate
                ? new Date(bill.billDate).toISOString().slice(0, 10)
                : '',
            dueDate: bill.dueDate
                ? new Date(bill.dueDate).toISOString().slice(0, 10)
                : '',
            notes: bill.notes || '',
        })

        setShowForm(true)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!form.patient) {
            toast.error('Please select a patient')
            return
        }

        if (
            form.items.some(
                (item) =>
                    !item.description.trim() ||
                    Number(item.quantity) < 1 ||
                    Number(item.unitPrice) < 0
            )
        ) {
            toast.error('Please enter valid billing items')
            return
        }

        if (Number(form.paidAmount) > totalAmount) {
            toast.error('Paid amount cannot exceed total amount')
            return
        }

        const payload = {
            ...form,
            tax: Number(form.tax),
            discount: Number(form.discount),
            paidAmount: Number(form.paidAmount),
            items: form.items.map((item) => ({
                ...item,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
            })),
        }

        try {
            if (editingId) {
                await API.put(`/bills/${editingId}`, payload)
                toast.success('Bill updated successfully')
            } else {
                await API.post('/bills', payload)
                toast.success('Bill created successfully')
            }

            setShowForm(false)
            setEditingId(null)
            fetchData()
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to save bill'
            )
        }
    }

    const openPaymentForm = (bill) => {
        setSelectedBill(bill)
        setPayment({
            amount: '',
            paymentMethod: 'Cash',
        })
        setShowPayment(true)
    }

    const handlePayment = async (e) => {
        e.preventDefault()

        try {
            await API.post(`/bills/${selectedBill._id}/payment`, {
                amount: Number(payment.amount),
                paymentMethod: payment.paymentMethod,
            })

            toast.success('Payment recorded successfully')
            setShowPayment(false)
            fetchData()
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Payment failed'
            )
        }
    }

    const handleCancel = async (bill) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel invoice ${bill.invoiceNumber}?`
        )

        if (!confirmed) return

        try {
            await API.patch(`/bills/${bill._id}/cancel`)
            toast.success('Bill cancelled successfully')
            fetchData()
        } catch (error) {
            toast.error(
                error.response?.data?.message || 'Failed to cancel bill'
            )
        }
    }

    const handlePrintReceipt = (downloadPdf = false) => {
        if (!selectedBill) return

        const bill = selectedBill

        const safe = (value) =>
            String(value ?? '').replace(/[&<>"']/g, (char) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[char])

        const formatDate = (date) =>
            date ? new Date(date).toLocaleDateString('en-IN') : '—'

        const itemsHtml = (bill.items || []).map((item) => `
        <tr>
            <td>${safe(item.description)}</td>
            <td class="center">${safe(item.quantity)}</td>
            <td class="right">${currency(item.unitPrice)}</td>
            <td class="right">${currency(
            item.amount ?? Number(item.quantity || 0) * Number(item.unitPrice || 0)
        )}</td>
        </tr>
    `).join('')

        const printWindow = window.open('', '_blank', 'width=900,height=700')

        if (!printWindow) {
            toast.error('Please allow pop-ups to print or download the receipt')
            return
        }

        printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Receipt - ${safe(bill.invoiceNumber)}</title>
            <style>
                * { box-sizing: border-box; }
                body {
                    margin: 0;
                    padding: 32px;
                    color: #1f2937;
                    font-family: Arial, sans-serif;
                }
                .receipt { max-width: 800px; margin: auto; }
                .header {
                    text-align: center;
                    padding-bottom: 22px;
                    border-bottom: 2px solid #2563eb;
                }
                .header h1 { color: #1d4ed8; margin-bottom: 6px; }
                .header p { color: #6b7280; font-size: 13px; margin: 4px; }
                .title { text-align: center; margin: 24px 0; }
                .details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 24px;
                }
                .detail { font-size: 13px; }
                .detail strong {
                    display: block;
                    color: #6b7280;
                    margin-bottom: 4px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 24px;
                    font-size: 13px;
                }
                th { background: #eff6ff; color: #1e40af; }
                th, td {
                    padding: 11px;
                    border: 1px solid #dbe3ee;
                }
                .center { text-align: center; }
                .right { text-align: right; }
                .totals {
                    width: 320px;
                    max-width: 100%;
                    margin-left: auto;
                    font-size: 13px;
                }
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 7px 0;
                }
                .grand-total {
                    border-top: 1px solid #9ca3af;
                    padding-top: 12px;
                    font-size: 16px;
                    font-weight: bold;
                }
                .paid { color: #15803d; }
                .due { color: #c2410c; font-weight: bold; }
                .notes {
                    margin-top: 24px;
                    padding: 12px;
                    background: #f9fafb;
                    font-size: 13px;
                }
                .footer {
                    margin-top: 42px;
                    padding-top: 16px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                }
                @media print {
                    body { padding: 0; }
                }
                @page { margin: 15mm; }
            </style>
        </head>
        <body>
            <main class="receipt">
                <header class="header">
                    <h1>MediCare Hospital</h1>
                    <p>Smart Hospital Management System</p>
                    <p>Patient Billing Receipt</p>
                </header>

                <h2 class="title">INVOICE / PAYMENT RECEIPT</h2>

                <section class="details">
                    <div class="detail">
                        <strong>Invoice Number</strong>
                        ${safe(bill.invoiceNumber)}
                    </div>
                    <div class="detail">
                        <strong>Patient Name</strong>
                        ${safe(getPatientName(bill))}
                    </div>
                    <div class="detail">
                        <strong>Bill Date</strong>
                        ${formatDate(bill.billDate)}
                    </div>
                    <div class="detail">
                        <strong>Due Date</strong>
                        ${formatDate(bill.dueDate)}
                    </div>
                    <div class="detail">
                        <strong>Payment Method</strong>
                        ${safe(bill.paymentMethod || '—')}
                    </div>
                    <div class="detail">
                        <strong>Payment Status</strong>
                        ${safe(bill.paymentStatus || '—')}
                    </div>
                </section>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th class="center">Qty</th>
                            <th class="right">Unit Price</th>
                            <th class="right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                </table>

                <section class="totals">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>${currency(bill.subtotal)}</span>
                    </div>
                    <div class="total-row">
                        <span>Tax</span>
                        <span>${currency(bill.tax)}</span>
                    </div>
                    <div class="total-row">
                        <span>Discount</span>
                        <span>${currency(bill.discount)}</span>
                    </div>
                    <div class="total-row grand-total">
                        <span>Total Amount</span>
                        <span>${currency(bill.totalAmount)}</span>
                    </div>
                    <div class="total-row paid">
                        <span>Paid Amount</span>
                        <span>${currency(bill.paidAmount)}</span>
                    </div>
                    <div class="total-row due">
                        <span>Due Amount</span>
                        <span>${currency(bill.dueAmount)}</span>
                    </div>
                </section>

                ${bill.notes ? `
                    <section class="notes">
                        <strong>Notes</strong>
                        <p>${safe(bill.notes)}</p>
                    </section>
                ` : ''}

                <footer class="footer">
                    Thank you for choosing MediCare Hospital.
                </footer>
            </main>

            <script>
                window.addEventListener('load', () => {
                    window.focus()
                    window.print()
                })
            <\/script>
        </body>
        </html>
    `)

        printWindow.document.close()
    }

    const statusClass = (status) => {
        const styles = {
            Paid: 'bg-green-100 text-green-700',
            Pending: 'bg-yellow-100 text-yellow-700',
            'Partially Paid': 'bg-blue-100 text-blue-700',
            Cancelled: 'bg-red-100 text-red-700',
        }

        return styles[status] || 'bg-gray-100 text-gray-700'
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <button
                        onClick={() => navigate('/')}
                        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                        <ArrowLeft size={17} />
                        Back to Dashboard
                    </button>
                    <p className="mb-1 text-sm text-gray-500">
                        Hospital Management / Billing
                    </p>
                    <h1 className="text-2xl font-bold text-gray-800">
                        Billing & Payments
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage patient invoices, payments and outstanding balances.
                    </p>
                </div>

                <button
                    onClick={openCreateForm}
                    className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
                >
                    <Plus size={18} />
                    Create New Bill
                </button>
            </div>

            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        title: 'Total Bills',
                        value: stats.totalBills,
                        icon: Receipt,
                        color: 'blue',
                    },
                    {
                        title: 'Total Revenue',
                        value: currency(stats.revenue),
                        icon: IndianRupee,
                        color: 'green',
                    },
                    {
                        title: 'Pending Dues',
                        value: currency(stats.pending),
                        icon: Wallet,
                        color: 'orange',
                    },
                    {
                        title: 'Fully Paid Bills',
                        value: stats.paid,
                        icon: CheckCircle,
                        color: 'purple',
                    },
                ].map((stat) => {
                    const Icon = stat.icon

                    return (
                        <div
                            key={stat.title}
                            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">{stat.title}</p>
                                    <h2 className="mt-2 text-xl font-bold text-gray-800">
                                        {stat.value}
                                    </h2>
                                </div>
                                <div className={`rounded-lg bg-${stat.color}-50 p-3`}>
                                    <Icon
                                        size={23}
                                        className={`text-${stat.color}-600`}
                                    />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Bills Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-5 md:flex-row md:items-center">
                    <div>
                        <h2 className="font-semibold text-gray-800">
                            All Invoices
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            View and manage hospital billing records.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <div className="relative">
                            <Search
                                size={17}
                                className="absolute left-3 top-3 text-gray-400"
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search invoice or patient..."
                                className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="All">All Status</option>
                            <option value="Pending">Pending</option>
                            <option value="Partially Paid">Partially Paid</option>
                            <option value="Paid">Paid</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>

                        <button
                            onClick={fetchData}
                            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="px-5 py-4 font-semibold">Invoice</th>
                                <th className="px-5 py-4 font-semibold">Patient</th>
                                <th className="px-5 py-4 font-semibold">Bill Date</th>
                                <th className="px-5 py-4 font-semibold">Total Amount</th>
                                <th className="px-5 py-4 font-semibold">Paid</th>
                                <th className="px-5 py-4 font-semibold">Due</th>
                                <th className="px-5 py-4 font-semibold">Status</th>
                                <th className="px-5 py-4 text-center font-semibold">Actions</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-12 text-center text-gray-500">
                                        Loading billing records...
                                    </td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-5 py-14 text-center">
                                        <Receipt
                                            size={38}
                                            className="mx-auto mb-3 text-gray-300"
                                        />
                                        <p className="font-medium text-gray-600">
                                            No bills found
                                        </p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            Create a new bill to get started.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill._id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4 font-medium text-blue-600">
                                            {bill.invoiceNumber}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-gray-800">
                                            {getPatientName(bill)}
                                        </td>
                                        <td className="px-5 py-4 text-gray-600">
                                            {new Date(bill.billDate).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-5 py-4 font-medium text-gray-800">
                                            {currency(bill.totalAmount)}
                                        </td>
                                        <td className="px-5 py-4 text-green-700">
                                            {currency(bill.paidAmount)}
                                        </td>
                                        <td className="px-5 py-4 text-orange-600">
                                            {currency(bill.dueAmount)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(bill.paymentStatus)}`}>
                                                {bill.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    title="View Bill"
                                                    onClick={() => {
                                                        setSelectedBill(bill)
                                                        setShowView(true)
                                                    }}
                                                    className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                                >
                                                    <Eye size={17} />
                                                </button>

                                                {bill.paymentStatus !== 'Cancelled' && (
                                                    <>
                                                        <button
                                                            title="Edit Bill"
                                                            onClick={() => openEditForm(bill)}
                                                            className="rounded-lg p-2 text-green-600 hover:bg-green-50"
                                                        >
                                                            <Pencil size={17} />
                                                        </button>

                                                        {bill.dueAmount > 0 && (
                                                            <button
                                                                title="Record Payment"
                                                                onClick={() => openPaymentForm(bill)}
                                                                className="rounded-lg p-2 text-purple-600 hover:bg-purple-50"
                                                            >
                                                                <CreditCard size={17} />
                                                            </button>
                                                        )}

                                                        {bill.paidAmount === 0 && (
                                                            <button
                                                                title="Cancel Bill"
                                                                onClick={() => handleCancel(bill)}
                                                                className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 size={17} />
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="border-t border-gray-200 px-5 py-3 text-sm text-gray-500">
                    Showing {filteredBills.length} of {bills.length} bills
                </div>
            </div>

            {/* Create / Edit Bill Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
                    <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
                        <div className="sticky top-0 flex items-center justify-between border-b bg-white p-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    {editingId ? 'Edit Bill' : 'Create New Bill'}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Enter patient and billing information.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-5">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Patient *
                                    </label>
                                    <select
                                        name="patient"
                                        value={form.patient}
                                        onChange={updateForm}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    >
                                        <option value="">Select Patient</option>
                                        {patients.map((patient) => (
                                            <option key={patient._id} value={patient._id}>
                                                {patient.user?.name || 'Unknown Patient'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Payment Method *
                                    </label>
                                    <select
                                        name="paymentMethod"
                                        value={form.paymentMethod}
                                        onChange={updateForm}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    >
                                        {['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'].map((method) => (
                                            <option key={method} value={method}>{method}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Bill Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="billDate"
                                        value={form.billDate}
                                        onChange={updateForm}
                                        required
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        name="dueDate"
                                        value={form.dueDate}
                                        onChange={updateForm}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg border border-gray-200 p-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800">
                                        Billing Items
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        <PlusCircle size={17} />
                                        Add Item
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {form.items.map((item, index) => (
                                        <div
                                            key={index}
                                            className="grid grid-cols-12 items-end gap-2"
                                        >
                                            <div className="col-span-12 md:col-span-5">
                                                <label className="mb-1 block text-xs text-gray-500">
                                                    Description
                                                </label>
                                                <input
                                                    value={item.description}
                                                    onChange={(e) =>
                                                        updateItem(index, 'description', e.target.value)
                                                    }
                                                    placeholder="Service / Medicine"
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="col-span-4 md:col-span-2">
                                                <label className="mb-1 block text-xs text-gray-500">
                                                    Quantity
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) =>
                                                        updateItem(index, 'quantity', e.target.value)
                                                    }
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="col-span-4 md:col-span-2">
                                                <label className="mb-1 block text-xs text-gray-500">
                                                    Unit Price
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unitPrice}
                                                    onChange={(e) =>
                                                        updateItem(index, 'unitPrice', e.target.value)
                                                    }
                                                    required
                                                    className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm outline-none focus:border-blue-500"
                                                />
                                            </div>

                                            <div className="col-span-3 md:col-span-2">
                                                <label className="mb-1 block text-xs text-gray-500">
                                                    Amount
                                                </label>
                                                <p className="rounded-lg bg-gray-50 px-2 py-2 text-sm font-medium">
                                                    {currency(
                                                        Number(item.quantity) * Number(item.unitPrice)
                                                    )}
                                                </p>
                                            </div>

                                            <div className="col-span-1">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    title="Remove item"
                                                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                                                >
                                                    <MinusCircle size={19} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Tax (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="tax"
                                        value={form.tax}
                                        onChange={updateForm}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Discount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        name="discount"
                                        value={form.discount}
                                        onChange={updateForm}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Paid Amount (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max={totalAmount}
                                        name="paidAmount"
                                        value={form.paidAmount}
                                        onChange={updateForm}
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg bg-blue-50 p-4">
                                <div className="flex justify-between py-1 text-sm text-gray-600">
                                    <span>Subtotal</span>
                                    <span>{currency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-sm text-gray-600">
                                    <span>Tax</span>
                                    <span>{currency(form.tax)}</span>
                                </div>
                                <div className="flex justify-between py-1 text-sm text-gray-600">
                                    <span>Discount</span>
                                    <span>- {currency(form.discount)}</span>
                                </div>
                                <div className="mt-2 flex justify-between border-t border-blue-200 pt-3 font-bold text-gray-800">
                                    <span>Total Amount</span>
                                    <span className="text-lg text-blue-700">
                                        {currency(totalAmount)}
                                    </span>
                                </div>
                                <div className="mt-2 flex justify-between text-sm">
                                    <span>Due Amount</span>
                                    <span className="font-semibold text-orange-600">
                                        {currency(Math.max(0, totalAmount - Number(form.paidAmount || 0)))}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Additional Notes
                                </label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={updateForm}
                                    rows="2"
                                    placeholder="Enter additional billing notes..."
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    {editingId ? 'Update Bill' : 'Save Bill'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Bill Modal */}
            {showView && selectedBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
                    <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    Invoice Details
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {selectedBill.invoiceNumber}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowView(false)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5 p-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <p className="text-xs text-gray-500">Patient</p>
                                    <p className="mt-1 font-semibold text-gray-800">
                                        {getPatientName(selectedBill)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Payment Status</p>
                                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusClass(selectedBill.paymentStatus)}`}>
                                        {selectedBill.paymentStatus}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Bill Date</p>
                                    <p className="mt-1 font-medium text-gray-800">
                                        {new Date(selectedBill.billDate).toLocaleDateString('en-IN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Payment Method</p>
                                    <p className="mt-1 font-medium text-gray-800">
                                        {selectedBill.paymentMethod}
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3 text-left">Description</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {selectedBill.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="p-3">{item.description}</td>
                                                <td className="p-3 text-center">{item.quantity}</td>
                                                <td className="p-3 text-right">{currency(item.unitPrice)}</td>
                                                <td className="p-3 text-right font-medium">{currency(item.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="ml-auto max-w-xs space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{currency(selectedBill.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tax</span>
                                    <span>{currency(selectedBill.tax)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Discount</span>
                                    <span>{currency(selectedBill.discount)}</span>
                                </div>
                                <div className="flex justify-between border-t pt-2 font-bold">
                                    <span>Total</span>
                                    <span>{currency(selectedBill.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-green-700">
                                    <span>Paid</span>
                                    <span>{currency(selectedBill.paidAmount)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-orange-600">
                                    <span>Due</span>
                                    <span>{currency(selectedBill.dueAmount)}</span>
                                </div>
                            </div>

                            {selectedBill.notes && (
                                <div className="rounded-lg bg-gray-50 p-3 text-sm">
                                    <p className="font-semibold text-gray-700">Notes</p>
                                    <p className="mt-1 text-gray-600">{selectedBill.notes}</p>
                                </div>
                            )}

                            {/* Receipt Actions */}
                            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end">

                                {/* Print Receipt Button */}
                                <button
                                    type="button"
                                    onClick={() => handlePrintReceipt(false)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                >
                                    <FileText size={17} />
                                    Print Receipt
                                </button>

                                {/* Download PDF Button */}
                                <button
                                    type="button"
                                    onClick={() => handlePrintReceipt(true)}
                                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                                >
                                    <Receipt size={17} />
                                    Download PDF
                                </button>

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {showPayment && selectedBill && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
                    <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b p-5">
                            <div>
                                <h2 className="font-bold text-gray-800">Record Payment</h2>
                                <p className="text-sm text-gray-500">
                                    {selectedBill.invoiceNumber}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPayment(false)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-4 p-5">
                            <div className="rounded-lg bg-orange-50 p-4">
                                <p className="text-sm text-gray-600">Outstanding Due</p>
                                <p className="mt-1 text-2xl font-bold text-orange-600">
                                    {currency(selectedBill.dueAmount)}
                                </p>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Payment Amount *
                                </label>
                                <input
                                    type="number"
                                    min="0.01"
                                    max={selectedBill.dueAmount}
                                    step="0.01"
                                    required
                                    value={payment.amount}
                                    onChange={(e) =>
                                        setPayment((prev) => ({
                                            ...prev,
                                            amount: e.target.value,
                                        }))
                                    }
                                    placeholder="Enter amount"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                    Payment Method *
                                </label>
                                <select
                                    value={payment.paymentMethod}
                                    onChange={(e) =>
                                        setPayment((prev) => ({
                                            ...prev,
                                            paymentMethod: e.target.value,
                                        }))
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
                                >
                                    {['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'].map((method) => (
                                        <option key={method} value={method}>{method}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPayment(false)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                >
                                    Save Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Billing

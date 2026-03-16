export default {
  name: 'purchase',
  title: 'Purchase',
  type: 'document',
  fields: [
    {
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{type: 'course'}],
      validation: (Rule) => Rule.required(),
    },
    {name: 'buyerName', title: 'Buyer Name', type: 'string'},
    {name: 'buyerWhatsApp', title: 'Buyer WhatsApp', type: 'string'},
    {
      name: 'razorpayOrderId',
      title: 'Razorpay Order ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'razorpayPaymentId',
      title: 'Razorpay Payment ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'razorpaySignature',
      title: 'Razorpay Signature',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'amount',
      title: 'Amount (paise)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    },
    {name: 'currency', title: 'Currency', type: 'string', validation: (Rule) => Rule.required()},
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {list: ['verified', 'failed']},
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'verifiedAt',
      title: 'Verified At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    },
  ],
  preview: {
    select: {
      title: 'razorpayPaymentId',
      subtitle: 'status',
    },
  },
}

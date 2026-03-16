export default {
  name: 'trialLead',
  title: 'Trial Lead',
  type: 'document',
  fields: [
    {name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()},
    {
      name: 'childAge',
      title: 'Child Age',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    },
    {
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      validation: (Rule) => Rule.required().min(8).max(20),
    },
    {name: 'message', title: 'Message', type: 'text'},
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
      initialValue: () => new Date().toISOString(),
      readOnly: true,
    },
    {name: 'source', title: 'Source', type: 'string'},
    {name: 'utmCampaign', title: 'UTM Campaign', type: 'string'},
    {name: 'utmSource', title: 'UTM Source', type: 'string'},
    {name: 'utmMedium', title: 'UTM Medium', type: 'string'},
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'whatsappNumber',
    },
  },
}

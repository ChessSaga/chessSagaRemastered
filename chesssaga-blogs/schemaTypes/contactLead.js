export default {
  name: 'contactLead',
  title: 'Contact Lead',
  type: 'document',
  fields: [
    {name: 'name', title: 'Name', type: 'string'},
    {name: 'email', title: 'Email', type: 'string'},
    {name: 'phone', title: 'Phone', type: 'string'},
    {name: 'childAge', title: 'Child Age', type: 'number'},
    {name: 'message', title: 'Message', type: 'text'},
    {name: 'source', title: 'Source', type: 'string'},
    {name: 'createdAt', title: 'Created At', type: 'datetime'},
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
    },
  },
}
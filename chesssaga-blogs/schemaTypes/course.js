export default {
  name: 'course',
  title: 'Course',
  type: 'document',
  fields: [
    {name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()},
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    },
    {name: 'description', title: 'Description', type: 'text', validation: (Rule) => Rule.required()},
    {
      name: 'price',
      title: 'Price (INR)',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    },
    {
      name: 'currency',
      title: 'Currency',
      type: 'string',
      initialValue: 'INR',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'isActive',
      title: 'Is Active',
      type: 'boolean',
      initialValue: true,
      validation: (Rule) => Rule.required(),
    },
    {name: 'ctaLabel', title: 'CTA Label', type: 'string', initialValue: 'Enroll Now'},
    {name: 'sortOrder', title: 'Sort Order', type: 'number', initialValue: 0},
  ],
  preview: {
    select: {
      title: 'title',
      price: 'price',
      active: 'isActive',
    },
    prepare({title, price, active}) {
      return {
        title,
        subtitle: `${active ? 'Active' : 'Inactive'} • INR ${price || 0}`,
      }
    },
  },
}

export default {
  name: 'about',
  title: 'About',
  type: 'document',
  fields: [
    { name: 'heading', title: 'Heading', type: 'string', validation: (Rule) => Rule.required() },
    {
      name: 'founder',
      title: 'Founder',
      type: 'object',
      fields: [
        { name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required() },
        { name: 'image', title: 'Image', type: 'image', options: { hotspot: true }, fields: [{ name: 'alt', title: 'Alt text', type: 'string' }] },
        { name: 'role', title: 'Role', type: 'string' },
      ],
    },
    {
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [
        { type: 'block' },
        { type: 'image', options: { hotspot: true }, fields: [{ name: 'alt', title: 'Alt text', type: 'string' }] },
      ],
      validation: (Rule) => Rule.required(),
    },
    { name: 'publishedAt', title: 'Published At', type: 'datetime' },
  ],
}

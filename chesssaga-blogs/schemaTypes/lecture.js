export default {
  name: 'lecture',
  title: 'Lecture',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'videoKey',
      title: 'Video Key',
      type: 'string',
      description: 'Exact R2 object key, for example course-slug/lesson-1.mp4',
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'course',
      title: 'Course',
      type: 'reference',
      to: [{type: 'course'}],
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'order',
      title: 'Order',
      type: 'number',
      validation: (Rule) => Rule.required().min(1),
    },
    {
      name: 'duration',
      title: 'Duration',
      type: 'string',
      description: 'Optional duration label, for example 12:30',
    },
  ],
  orderings: [
    {
      title: 'Order Ascending',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {
      title: 'title',
      courseTitle: 'course.title',
      order: 'order',
    },
    prepare({title, courseTitle, order}) {
      return {
        title,
        subtitle: `${courseTitle || 'No course'} • Lecture ${order || 0}`,
      }
    },
  },
}

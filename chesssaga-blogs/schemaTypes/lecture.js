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
    {
      name: 'checkpoints',
      title: 'Interactive Checkpoints',
      type: 'array',
      description:
        'Decision points where the video pauses and the learner must play a move. Leave empty for a normal lecture.',
      of: [
        {
          type: 'object',
          name: 'checkpoint',
          fields: [
            {
              name: 'atSec',
              title: 'Pause at (seconds)',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'resumeSec',
              title: 'Resume main lesson at (seconds)',
              type: 'number',
              description: 'Where main content continues, after all explanation segments.',
              validation: (Rule) => Rule.required().min(0),
            },
            {
              name: 'fen',
              title: 'Position (FEN)',
              type: 'string',
              description: 'Paste from lichess.org/editor',
              validation: (Rule) => Rule.required(),
            },
            {
              name: 'prompt',
              title: 'Prompt',
              type: 'string',
              description: 'For example: White to move. Find the strongest continuation.',
            },
            {
              name: 'hint',
              title: 'Hint',
              type: 'string',
              description: 'Optional nudge shown beside the board, for example: think about development.',
            },
            {
              name: 'branches',
              title: 'Branches',
              type: 'array',
              validation: (Rule) => Rule.required().min(1),
              of: [
                {
                  type: 'object',
                  name: 'branch',
                  fields: [
                    {
                      name: 'moves',
                      title: 'Moves (SAN)',
                      type: 'array',
                      of: [{type: 'string'}],
                      description:
                        'For example Nxe5, Nf3. Leave EMPTY on exactly one branch to make it the fallback for any other legal move.',
                    },
                    {
                      name: 'category',
                      title: 'Category',
                      type: 'string',
                      options: {list: ['correct', 'alternative', 'mistake']},
                      validation: (Rule) => Rule.required(),
                    },
                    {
                      name: 'label',
                      title: 'Feedback line',
                      type: 'string',
                    },
                    {
                      name: 'startSec',
                      title: 'Explanation starts (seconds)',
                      type: 'number',
                      validation: (Rule) => Rule.required().min(0),
                    },
                    {
                      name: 'endSec',
                      title: 'Explanation ends (seconds)',
                      type: 'number',
                      validation: (Rule) => Rule.required().min(0),
                    },
                  ],
                  preview: {
                    select: {category: 'category', label: 'label', moves: 'moves'},
                    prepare({category, label, moves}) {
                      return {
                        title: (moves || []).join(', ') || 'Any other legal move',
                        subtitle: `${category || 'uncategorised'}${label ? ` - ${label}` : ''}`,
                      }
                    },
                  },
                },
              ],
            },
          ],
          preview: {
            select: {atSec: 'atSec', prompt: 'prompt'},
            prepare({atSec, prompt}) {
              return {
                title: `Checkpoint at ${atSec || 0}s`,
                subtitle: prompt || '',
              }
            },
          },
        },
      ],
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

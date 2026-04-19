import {createClient} from '@sanity/client'
import {getAdminConfig} from './env.js'

let client

function getClient() {
  if (client) return client

  const config = getAdminConfig()
  client = createClient({
    projectId: config.sanityProjectId,
    dataset: config.sanityDataset,
    apiVersion: config.sanityApiVersion,
    token: config.sanityApiWriteToken,
    useCdn: false,
  })

  return client
}

export async function fetchLecturesWithCourse() {
  return getClient().fetch(
    `*[_type == "lecture"] | order(course->title asc, order asc) {
      _id,
      title,
      order,
      duration,
      videoKey,
      "courseId": course->_id,
      "courseTitle": course->title
    }`
  )
}

export async function fetchCourses() {
  return getClient().fetch(
    `*[_type == "course" && isActive == true] | order(sortOrder asc, title asc) {
      _id,
      title
    }`
  )
}

export async function updateLectureVideoKey(lectureId, videoKey) {
  return getClient().patch(lectureId).set({videoKey}).commit({autoGenerateArrayKeys: true})
}

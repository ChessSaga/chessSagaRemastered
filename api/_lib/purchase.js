import {sanityServerClient} from './sanity.js'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeEmail(value) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase()
}

export function isValidEmail(value) {
  return emailRegex.test(normalizeEmail(value))
}

export async function getPurchasedCoursesByEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  if (!isValidEmail(normalizedEmail)) {
    return {
      success: false,
      email: normalizedEmail,
      message: 'A valid email address is required',
      courses: [],
    }
  }

  const purchases = await sanityServerClient.fetch(
    `*[_type == 'purchase' && lower(coalesce(buyerEmail, '')) == $email && status in ['success', 'verified'] && defined(course._ref)] | order(verifiedAt desc){
      _id,
      'courseId': course._ref,
      'courseTitle': course->title,
      status,
      verifiedAt
    }`,
    {email: normalizedEmail}
  )

  const uniqueByCourse = new Map()
  for (const item of purchases || []) {
    if (!item?.courseId) continue
    if (!uniqueByCourse.has(item.courseId)) {
      uniqueByCourse.set(item.courseId, {
        purchaseId: item._id,
        courseId: item.courseId,
        title: item.courseTitle || 'Untitled Course',
        status: item.status,
        verifiedAt: item.verifiedAt,
      })
    }
  }

  const courses = Array.from(uniqueByCourse.values())
  if (courses.length === 0) {
    return {
      success: false,
      email: normalizedEmail,
      message: 'No course found for this email',
      courses,
    }
  }

  return {
    success: true,
    email: normalizedEmail,
    courses,
    courseIds: courses.map((course) => course.courseId),
  }
}

export async function getPurchasedCourseByEmail(email) {
  const result = await getPurchasedCoursesByEmail(email)
  if (!result.success) return result

  const latest = result.courses[0]
  return {
    success: true,
    email: result.email,
    purchaseId: latest.purchaseId,
    courseId: latest.courseId,
    status: latest.status,
    verifiedAt: latest.verifiedAt,
    courses: result.courses,
    courseIds: result.courseIds,
  }
}

export async function userOwnsCourse(email, courseId) {
  if (typeof courseId !== 'string' || !courseId.trim()) return false
  const result = await getPurchasedCoursesByEmail(email)
  if (!result.success) return false
  return result.courseIds.includes(courseId.trim())
}

export async function hasSuccessfulPurchaseByEmail(email) {
  const result = await getPurchasedCoursesByEmail(email)
  return result.success
}

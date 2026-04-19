import {GetObjectCommand, HeadObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {allowMethods, parseJsonBody, sendJson, setCorsHeaders} from './_lib/http.js'
import {userOwnsCourse} from './_lib/purchase.js'
import {getR2BucketName, getR2Client} from './_lib/r2Client.js'
import {sanityServerClient} from './_lib/sanity.js'
import {getVerifiedUserByAccessToken} from './_lib/supabaseAuth.js'

const SIGNED_URL_EXPIRY_SECONDS = 300

export default async function handler(req, res) {
  if (setCorsHeaders(req, res)) return
  if (!allowMethods(req, res, ['POST'])) return

  try {
    const payload = await parseJsonBody(req)
    const accessToken = typeof payload.accessToken === 'string' ? payload.accessToken : ''
    const courseId = typeof payload.courseId === 'string' ? payload.courseId.trim() : ''
    const videoKey = typeof payload.videoKey === 'string' ? payload.videoKey.trim() : ''

    const user = await getVerifiedUserByAccessToken(accessToken)
    if (!user.success) {
      return sendJson(res, 401, {
        success: false,
        error: user.message,
      })
    }

    const email = user.email

    if (!courseId) {
      return sendJson(res, 400, {
        success: false,
        error: 'courseId is required',
      })
    }

    if (!videoKey) {
      return sendJson(res, 400, {
        success: false,
        error: 'videoKey is required',
      })
    }

    const ownsCourse = await userOwnsCourse(email, courseId)
    if (!ownsCourse) {
      return sendJson(res, 403, {
        success: false,
        error: 'You do not own this course',
      })
    }

    const lecture = await sanityServerClient.fetch(
      `*[_type == 'lecture' && course._ref == $courseId && videoKey == $videoKey][0]{_id, title}`,
      {courseId, videoKey}
    )

    if (!lecture?._id) {
      return sendJson(res, 403, {
        success: false,
        error: 'Requested video is not part of your purchased course',
      })
    }

    const r2Client = getR2Client()
    const bucketName = getR2BucketName()

    await r2Client.send(
      new HeadObjectCommand({
        Bucket: bucketName,
        Key: videoKey,
      })
    )

    const signedUrl = await getSignedUrl(
      r2Client,
      new GetObjectCommand({
        Bucket: bucketName,
        Key: videoKey,
      }),
      {expiresIn: SIGNED_URL_EXPIRY_SECONDS}
    )

    return sendJson(res, 200, {
      success: true,
      videoKey,
      lectureTitle: lecture.title,
      signedUrl,
      expiresIn: SIGNED_URL_EXPIRY_SECONDS,
    })
  } catch (error) {
    const statusCode = error?.$metadata?.httpStatusCode === 404 ? 404 : 500
    return sendJson(res, statusCode, {
      success: false,
      error: statusCode === 404 ? 'Video not found' : 'Unable to generate secure video URL',
      details: error.message,
    })
  }
}

/**
 * The signed-in user's details, as the impact assessor records them against a
 * saved record. Read from the session so they cannot be set from the form.
 *
 * @param {import('@hapi/hapi').Request} request
 * @returns {{ staffId: string, staffFullName: string, staffEmail: string }}
 */
export function getStaffDetails(request) {
  const { id, displayName, email } = request.auth.credentials
  return { staffId: id, staffFullName: displayName, staffEmail: email }
}

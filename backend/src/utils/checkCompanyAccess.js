export default function checkCompanyAccess(user, targetCompanyId, options = {}) {
  const { allowMissing = false } = options;

  if (!targetCompanyId) {
    if (allowMissing) {
      return;
    }
    const error = new Error(
      "Access denied: missing or invalid company_id"
    );
    error.code = "COMPANY_ACCESS_MISSING";
    error.statusCode = 400;
    throw error;
  }

  if (user.role_id === "ADMIN") {
    return;
  }

  if (targetCompanyId !== user.company_id) {
    const error = new Error(
      "Access denied: you cannot operate on other companies"
    );
    error.code = "COMPANY_ACCESS_DENIED";
    error.statusCode = 403;
    throw error;
  }
}

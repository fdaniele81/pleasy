export default function checkCompanyAccess(user, targetCompanyId, options = {}) {
  const { allowMissing = false } = options;

  if (!targetCompanyId) {
    if (allowMissing) {
      return;
    }
    const error = new Error(
      "Accesso negato: company_id mancante o non valido"
    );
    error.statusCode = 400;
    throw error;
  }

  if (user.role_id === "ADMIN") {
    return;
  }

  if (targetCompanyId !== user.company_id) {
    const error = new Error(
      "Accesso negato: non puoi operare su altre company"
    );
    error.statusCode = 403;
    error.details = {
      your_company: user.company_id,
      target_company: targetCompanyId,
    };
    throw error;
  }
}
